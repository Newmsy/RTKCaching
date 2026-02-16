import { Component, inject, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { RtkService } from '../services/rtk-service';
import { Location, WeatherResponse } from '../models/weather';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private rtkService = inject(RtkService);

  public locations = signal<Location[]>([
    { name: 'London', latitude: 51.5074, longitude: -0.1278 },
    { name: 'New York', latitude: 40.7128, longitude: -74.006 },
    { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
    { name: 'Sydney', latitude: -33.8688, longitude: 151.2093 },
  ]);

  public selectedLocation = signal<Location>(this.locations()[0]);

  // Make weather$ reactive to selectedLocation changes
  public weather$ = toObservable(this.selectedLocation).pipe(
    switchMap((location) =>
      this.rtkService.makeQueryRequest<WeatherResponse>({
        endpoint: `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,wind_speed_10m`,
        providesTag: 'weather',
      }),
    ),
  );

  public weatherResult = toSignal(this.weather$);

  public selectLocation(location: Location) {
    this.selectedLocation.set(location);
  }
}
