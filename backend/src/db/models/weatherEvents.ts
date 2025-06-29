export interface WeatherEventRecord {
  id: number;
  city: string;
  timestamp: string;

  temperature: number;

  created_at: string;
  updated_at: string;
}

export interface SaveWeatherEventRecord
  extends Pick<WeatherEventRecord, "city" | "timestamp" | "temperature"> {}
