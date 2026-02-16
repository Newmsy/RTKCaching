import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, switchMap } from 'rxjs';
import { RtkService } from '../services/rtk-service';
import { Location, WeatherResponse } from '../models/weather';

@Component({
  selector: 'app-lazy-request-demo',
  imports: [],
  templateUrl: './lazy-request-demo.component.html',
  styleUrl: './lazy-request-demo.component.css',
})
export class LazyRequestDemoComponent {
  private rtkService = inject(RtkService);

  public locations: Location[] = [
    { name: 'Paris', latitude: 48.8566, longitude: 2.3522 },
    { name: 'Berlin', latitude: 52.52, longitude: 13.405 },
    { name: 'Madrid', latitude: 40.4168, longitude: -3.7038 },
  ];

  public selectedLocation = signal<Location | null>(null);
  public preferCache = signal(true);
  public fetchCount = signal(0);

  // Use Subject + switchMap for lazy requests with automatic subscription management
  private fetchTrigger$ = new Subject<Location>();
  private weather$ = this.fetchTrigger$.pipe(
    switchMap((location) => {
      const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,wind_speed_10m`;

      return this.rtkService.makeLazyRequest<WeatherResponse>({
        endpoint,
        providesTag: 'lazy-weather',
        preferCache: this.preferCache(),
      })();
    }),
  );

  public weatherResult = toSignal(this.weather$);

  public fetchWeather(location: Location) {
    this.selectedLocation.set(location);
    this.fetchCount.update((c) => c + 1);
    this.fetchTrigger$.next(location);
  }

  public toggleCachePreference() {
    this.preferCache.update((v) => !v);
  }
}
