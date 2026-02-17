import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  concat,
  defer,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { QueryRequestConfig, LazyRequestConfig, MutationRequestConfig } from '../models/rtk-types';

export interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error?: any;
}

@Injectable({ providedIn: 'root' })
export class RtkService {
  private readonly baseUrl = 'ENTER_YOUR_API_BASE_URL_HERE'; // Set your API base URL if needed
  private httpClient = inject(HttpClient);

  private tags = new Map<string, Set<string>>(); // cache key to set of tags mapping
  private cache = new Map<
    string,
    {
      data$: Observable<any>;
      refetch$: BehaviorSubject<void>;
      subscriptionCount: number;
      isStale: boolean;
    }
  >(); // cache key to {observable, refetch trigger, subscription count, stale flag}

  public makeQueryRequest<T>(config: QueryRequestConfig): Observable<QueryResult<T>> {
    const { endpoint, params, providesTag, method = 'GET' } = config;
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(params)}`;

    // Check if endpoint is absolute URL
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`;

    if (!this.cache.has(cacheKey)) {
      const refetch$ = new BehaviorSubject<void>(undefined);
      const data$ = refetch$.pipe(
        switchMap(() => {
          const request$ = (
            method === 'GET'
              ? this.httpClient.get<T>(url, { params })
              : this.httpClient.post<T>(url, params)
          ).pipe(
            map((data) => ({ data, isLoading: false, error: null })),
            catchError((error) => of({ data: null, isLoading: false, error })),
          );

          // Emit loading state first, then the actual data
          return concat(of({ data: null, isLoading: true, error: null }), request$);
        }),
        shareReplay(1),
      );

      this.cache.set(cacheKey, { data$, refetch$, subscriptionCount: 0, isStale: false });
    }

    // Always register the tag, even if the cache entry already exists
    if (providesTag) {
      if (!this.tags.has(cacheKey)) {
        this.tags.set(cacheKey, new Set());
      }
      this.tags.get(cacheKey)!.add(providesTag);
    }

    const cacheEntry = this.cache.get(cacheKey)!;

    // Return an observable that tracks subscriptions using defer
    // Defer is kind of like a factory for observables - it creates a new observable for each subscriber, allowing us to track subscription counts accurately
    return defer(() => {
      cacheEntry.subscriptionCount++;
      console.log(`[${cacheKey}] Subscription added, count: ${cacheEntry.subscriptionCount}`);

      // If this query was marked as stale while unsubscribed, trigger a refetch now
      if (cacheEntry.isStale) {
        console.log(`[${cacheKey}] Query is stale, triggering refetch on subscription`);
        cacheEntry.isStale = false;
        cacheEntry.refetch$.next();
      }

      return cacheEntry.data$.pipe(
        finalize(() => {
          cacheEntry.subscriptionCount--;
          console.log(`[${cacheKey}] Subscription removed, count: ${cacheEntry.subscriptionCount}`);
        }),
      );
    });
  }

  public makeLazyRequest<T>(
    config: LazyRequestConfig,
  ): (params?: any) => Observable<QueryResult<T>> {
    const { endpoint, providesTag, method = 'GET', preferCache = true } = config;

    if (preferCache) {
      return (params?: any) => this.makeQueryRequest<T>({ endpoint, params, providesTag, method });
    } else {
      // Always make a fresh request, bypass cache
      return (params?: any) => {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`;
        const request$ = (
          method === 'GET'
            ? this.httpClient.get<T>(url, { params })
            : this.httpClient.post<T>(url, params)
        ).pipe(
          map((data) => ({ data, isLoading: false, error: null })),
          catchError((error) => of({ data: null, isLoading: false, error })),
        );

        // Emit loading state first, then the actual data
        return concat(of({ data: null, isLoading: true, error: null }), request$);
      };
    }
  }

  public makeMutationRequest<T, U>(config: MutationRequestConfig<U>): Observable<T> {
    const { endpoint, payload, invalidatesTag, method = 'POST' } = config;
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`;

    return (
      method === 'POST'
        ? this.httpClient.post<T>(url, payload)
        : this.httpClient.get<T>(url, { params: payload as any })
    ).pipe(
      tap({
        next: () => {
          console.log(`Mutation completed, invalidating tag: ${invalidatesTag}`);
          this.invalidateCacheByTag(invalidatesTag);
        },
        error: (err) => {
          console.error('Mutation failed, skipping cache invalidation:', err);
        },
      }),
    );
  }

  public invalidateCacheByTag(tag: string) {
    console.log('Invalidating tag:', tag);
    for (const [key, tagSet] of this.tags.entries()) {
      if (tagSet.has(tag) && this.cache.has(key)) {
        const cacheEntry = this.cache.get(key)!;

        // Only refetch if there are active subscriptions
        if (cacheEntry.subscriptionCount > 0) {
          console.log(
            `Triggering refetch for: ${key} (${cacheEntry.subscriptionCount} active subscribers)`,
          );
          cacheEntry.refetch$.next();
        } else {
          console.log(
            `Marking as stale: ${key} (no active subscribers, will refetch on next subscription)`,
          );
          cacheEntry.isStale = true;
        }
      }
    }
  }

  public clearCache() {
    console.log('Clearing cache and triggering refetch for active queries');
    // Trigger refetch for all cached queries with active subscriptions
    for (const [key, value] of this.cache.entries()) {
      if (value.subscriptionCount > 0) {
        console.log(
          `Triggering refetch for: ${key} (${value.subscriptionCount} active subscribers)`,
        );
        value.refetch$.next();
      } else {
        console.log(
          `Marking as stale: ${key} (no active subscribers, will refetch on next subscription)`,
        );
        value.isStale = true;
      }
    }
    console.log('Cache invalidation complete (cache entries preserved for active subscriptions)');
  }
}
