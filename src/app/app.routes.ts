import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'weather',
    pathMatch: 'full',
  },
  {
    path: 'weather',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'cache-control',
    loadComponent: () =>
      import('./cache-control/cache-control.component').then((m) => m.CacheControlComponent),
  },
  {
    path: 'lazy-demo',
    loadComponent: () =>
      import('./lazy-request-demo/lazy-request-demo.component').then(
        (m) => m.LazyRequestDemoComponent,
      ),
  },
  {
    path: 'tag-invalidation',
    loadComponent: () =>
      import('./tag-invalidation-demo/tag-invalidation-demo').then((m) => m.TagInvalidationDemo),
  },
];
