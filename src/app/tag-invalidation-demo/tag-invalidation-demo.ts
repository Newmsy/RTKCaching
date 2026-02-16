import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RtkService } from '../services/rtk-service';
import { WeatherResponse } from '../models/weather';

@Component({
  selector: 'app-tag-invalidation-demo',
  imports: [],
  templateUrl: './tag-invalidation-demo.html',
  styleUrl: './tag-invalidation-demo.css',
})
export class TagInvalidationDemo {
  private rtkService = inject(RtkService);

  // Multiple queries with the same tag - they will all be invalidated together
  public parisWeather$ = this.rtkService.makeQueryRequest<WeatherResponse>({
    endpoint: `https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&current=temperature_2m,wind_speed_10m`,
    providesTag: 'cities',
  });

  public londonWeather$ = this.rtkService.makeQueryRequest<WeatherResponse>({
    endpoint: `https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m,wind_speed_10m`,
    providesTag: 'cities',
  });

  public berlinWeather$ = this.rtkService.makeQueryRequest<WeatherResponse>({
    endpoint: `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.405&current=temperature_2m,wind_speed_10m`,
    providesTag: 'cities',
  });

  public parisWeatherResult = toSignal(this.parisWeather$);
  public londonWeatherResult = toSignal(this.londonWeather$);
  public berlinWeatherResult = toSignal(this.berlinWeather$);

  // Method 1: Manual invalidation
  public manualInvalidateTag() {
    console.log('=== Manual Tag Invalidation ===');
    console.log('Calling invalidateCacheByTag("cities") directly');
    this.rtkService.invalidateCacheByTag('cities');
  }

  // Method 2: Mutation-based invalidation (simulated)
  public mutationInvalidateTag() {
    console.log('=== Mutation-Based Tag Invalidation ===');
    console.log(
      'Making a mutation request that will auto-invalidate "cities" tag after completion',
    );

    // Simulate a mutation that updates weather data
    // In a real app, this would be a POST/PUT/DELETE to your API
    this.rtkService
      .makeMutationRequest<any, any>({
        endpoint:
          'https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&current=temperature_2m',
        payload: {},
        invalidatesTag: 'cities',
        method: 'GET', // Using GET for demo purposes (Open-Meteo doesn't have mutation endpoints)
      })
      .subscribe({
        next: () => {
          console.log(
            'Mutation completed successfully - cache invalidation triggered automatically',
          );
        },
        error: (err) => {
          console.error('Mutation failed:', err);
        },
      });
  }
}
