import { Component, inject, signal, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { RtkService, QueryResult } from '../services/rtk-service';
import { Location, WeatherResponse } from '../models/weather';

@Component({
  selector: 'app-lazy-request-demo',
  imports: [],
  templateUrl: './lazy-request-demo.component.html',
  styleUrl: './lazy-request-demo.component.css',
})
export class LazyRequestDemoComponent implements OnDestroy {
  private rtkService = inject(RtkService);
  private currentSubscription?: Subscription;

  public locations: Location[] = [
    { name: 'Paris', latitude: 48.8566, longitude: 2.3522 },
    { name: 'Berlin', latitude: 52.52, longitude: 13.405 },
    { name: 'Madrid', latitude: 40.4168, longitude: -3.7038 },
  ];

  public selectedLocation = signal<Location | null>(null);
  public preferCache = signal(true);
  public weatherData = signal<WeatherResponse | null>(null);
  public loading = signal(false);
  public error = signal<any>(null);
  public fetchCount = signal(0);

  public fetchWeather(location: Location) {
    // Unsubscribe from previous request to prevent subscription leaks
    this.currentSubscription?.unsubscribe();

    this.selectedLocation.set(location);
    this.fetchCount.update((c) => c + 1);

    const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,wind_speed_10m`;

    let request$;

    if (this.preferCache()) {
      // Use cached request
      request$ = this.rtkService.makeQueryRequest<WeatherResponse>({
        endpoint: endpoint,
        providesTag: 'lazy-weather',
      });
    } else {
      // Bypass cache - make fresh request every time
      request$ = this.rtkService.makeLazyRequest<WeatherResponse>({
        endpoint: endpoint,
        providesTag: 'lazy-weather',
        preferCache: false,
      })();
    }

    this.currentSubscription = request$.subscribe({
      next: (result: QueryResult<WeatherResponse>) => {
        this.loading.set(result.isLoading);
        this.weatherData.set(result.data);
        this.error.set(result.error || null);
      },
      error: (err) => {
        console.error('Error fetching weather:', err);
        this.loading.set(false);
        this.error.set(err);
      },
    });
  }

  ngOnDestroy() {
    this.currentSubscription?.unsubscribe();
  }

  public toggleCachePreference() {
    this.preferCache.update((v) => !v);
  }
}
