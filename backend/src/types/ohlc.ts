export interface TemperatureOHLC {
  city: string;
  hour: string; // ISO hour format: YYYY-MM-DDTHH:00:00Z
  open: number;
  high: number;
  low: number;
  close: number;
  count: number; // Number of data points in this hour
}

export interface OHLCAggregationOptions {
  startDate?: Date;
  endDate?: Date;
  cities?: string[];
}
