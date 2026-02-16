export interface QueryRequestConfig {
  endpoint: string;
  params?: any;
  providesTag?: string;
  method?: 'GET' | 'POST';
}

export interface LazyRequestConfig {
  endpoint: string;
  providesTag?: string;
  method?: 'GET' | 'POST';
  preferCache?: boolean;
}

export interface MutationRequestConfig<U> {
  endpoint: string;
  payload: U;
  invalidatesTag: string;
  method?: 'GET' | 'POST';
}
