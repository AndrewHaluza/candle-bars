// Weather data types for temperature aggregation
export interface WeatherDataPoint {
  city: string;
  timestamp: Date;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  condition: string;
}

export interface WeatherOHLC {
  x: Date;
  y: [number, number, number, number]; // [open, high, low, close] temperatures
  city: string;
  dataPoints: number; // Number of data points aggregated
}

export interface WeatherCondition {
  name: string;
  icon: string;
  color: string;
}