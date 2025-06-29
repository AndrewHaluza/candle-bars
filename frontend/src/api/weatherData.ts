import type { WeatherOHLC } from "../utils/weatherData";

export interface APIWeatherOHLC {
  id?: number;
  city: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  created_at?: string;
  updated_at?: string;
}

export const fetchWeatherDataFromAPI = async (
  city: string,
  startDate?: string,
  endDate?: string
): Promise<WeatherOHLC[]> => {
  try {
    const params = new URLSearchParams({ city });

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await fetch(
      `http://localhost:3000/api/v1/weather/by-city?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch weather data");
    }

    // Convert API response to frontend format
    return result.data.map(
      (item: APIWeatherOHLC): WeatherOHLC => ({
        x: new Date(item.timestamp),
        y: [item.open, item.high, item.low, item.close],
        city: item.city,
        dataPoints: 1, // Each record represents aggregated data
      })
    );
  } catch (error) {
    console.error("Error fetching weather data from API:", error);
    throw error;
  }
};
