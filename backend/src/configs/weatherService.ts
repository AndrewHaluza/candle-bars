export const weatherServiceConfig = {
  maxRetries: 5,
  retryDelay: 3000,
} as const;

export type WeatherServiceConfig = typeof weatherServiceConfig;
