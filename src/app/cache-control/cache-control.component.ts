import { Component, inject } from '@angular/core';
import { RtkService } from '../services/rtk-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { WeatherResponse } from '../models/weather';

@Component({
  selector: 'app-cache-control',
  imports: [],
  templateUrl: './cache-control.component.html',
  styleUrl: './cache-control.component.css',
})
export class CacheControlComponent {
  private rtkService = inject(RtkService);

  // Fetch weather for London - will use cache
  public londonWeather$ = this.rtkService.makeQueryRequest<WeatherResponse>({
    endpoint: `https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m,wind_speed_10m`,
    providesTag: 'weather',
  });

  public londonWeatherResult = toSignal(this.londonWeather$);

  public clearCache() {
    console.log('Clearing cache from CacheControlComponent');
    this.rtkService.clearCache();
  }
}
