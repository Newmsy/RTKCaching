import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'tag-invalidation',
    renderMode: RenderMode.Client,
  },
  {
    path: 'lazy-demo',
    renderMode: RenderMode.Client,
  },
  {
    path: 'cache-control',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
