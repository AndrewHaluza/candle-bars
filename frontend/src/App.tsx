import { useEffect, useState } from "react";

import { fetchWeatherDataFromAPI } from "./api/weatherData";
import "./App.css";
import WeatherChart from "./components/WeatherChart";
import type { WeatherOHLC } from "./utils/weatherData";

const API_CITIES = ["Berlin", "NewYork", "Tokyo", "SaoPaulo", "CapeTown"];

// Time range constants with proper mapping
const TIME_RANGES = {
  ONE_HOUR: { value: 0.04, label: "1 Hour" },
  TWO_HOURS: { value: 0.08, label: "2 Hours" },
  SIX_HOURS: { value: 0.25, label: "6 Hours" },
  ONE_WEEK: { value: 1, label: "1 Week" },
  TWO_WEEKS: { value: 2, label: "2 Weeks" },
  THREE_MONTHS: { value: 3, label: "3 Months" },
  SIX_MONTHS: { value: 6, label: "6 Months" },
  ONE_YEAR: { value: 12, label: "1 Year" },
} as const;

function App() {
  const [chartData, setChartData] = useState<WeatherOHLC[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>(API_CITIES[0]);
  const [timeframe, setTimeframe] = useState<number>(
    TIME_RANGES.SIX_MONTHS.value
  ); // 6 months by default
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRealWeatherData = async (city: string) => {
      setLoading(true);

      try {
        const endDate = new Date();
        const startDate = new Date();

        // Calculate start date based on timeframe
        switch (timeframe) {
          case TIME_RANGES.ONE_HOUR.value:
            startDate.setHours(startDate.getHours() - 1);
            break;
          case TIME_RANGES.TWO_HOURS.value:
            startDate.setHours(startDate.getHours() - 2);
            break;
          case TIME_RANGES.SIX_HOURS.value:
            startDate.setHours(startDate.getHours() - 6);
            break;
          case TIME_RANGES.ONE_WEEK.value:
            startDate.setDate(startDate.getDate() - 7);
            break;
          case TIME_RANGES.TWO_WEEKS.value:
            startDate.setDate(startDate.getDate() - 14);
            break;
          case TIME_RANGES.THREE_MONTHS.value:
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          case TIME_RANGES.SIX_MONTHS.value:
            startDate.setMonth(startDate.getMonth() - 6);
            break;
          case TIME_RANGES.ONE_YEAR.value:
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            startDate.setMonth(startDate.getMonth() - 6); // Default to 6 months
        }

        const data = await fetchWeatherDataFromAPI(
          city,
          startDate.toISOString(),
          endDate.toISOString()
        );

        if (data) {
          setChartData(data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    if (API_CITIES.includes(selectedCity)) {
      fetchRealWeatherData(selectedCity);
    } else {
      console.warn(`City ${selectedCity} not supported for data`);
      setChartData([]);
    }
  }, [timeframe, selectedCity]);

  const handleTimeframeChange = (period: number) => {
    setTimeframe(period);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
      <header
        style={{
          textAlign: "center",
          marginBottom: "20px",
          paddingTop: "20px",
        }}
      >
        <h1 style={{ color: "#333", fontSize: "2.5rem", margin: "0" }}>
          Weather Temperature
        </h1>
      </header>

      <div className="controls">
        <div
          style={{
            display: "flex",
            gap: "15px",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "20px",
            minHeight: "40px", // Reserve space to prevent layout shifts
          }}
        >
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            style={{
              padding: "10px 15px",
              borderRadius: "6px",
              border: "2px solid #e0e0e0",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {API_CITIES.map((city: string) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <span
            style={{ marginRight: "15px", color: "#666", fontWeight: "600" }}
          >
            Time Range:
          </span>
          {Object.values(TIME_RANGES).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleTimeframeChange(value)}
              style={{
                padding: "8px 16px",
                margin: "0 5px",
                backgroundColor: timeframe === value ? "#007bff" : "#f8f9fa",
                color: timeframe === value ? "white" : "#333",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          minHeight: "500px", // Reserve space for chart to prevent layout shifts
          display: "flex",
          flexDirection: "column",
        }}
      >
        <WeatherChart
          loading={loading}
          data={chartData}
          title={`Temperature - ${selectedCity}`}
          city={selectedCity}
          height={500}
        />
      </div>
    </div>
  );
}

export default App;
