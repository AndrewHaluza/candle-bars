export interface WeatherHourlyOHLCRecord {
  id?: number;
  city: string;
  timestamp: string;

  open: number;
  close: number;
  high: number;
  low: number;

  created_at?: string;
  updated_at?: string;
}


export interface SaveWeatherHourlyOHLCRecord
  extends Pick<WeatherHourlyOHLCRecord, "city" | "timestamp" | "open" | "close" | "high" | "low"> {}