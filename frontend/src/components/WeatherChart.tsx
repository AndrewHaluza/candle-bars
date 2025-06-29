import type { ApexOptions } from "apexcharts";
import React from "react";
import Chart from "react-apexcharts";

import type { WeatherOHLC } from "../utils/weatherData";

interface WeatherChartProps {
  data: WeatherOHLC[];
  loading: boolean;
  title?: string;
  height?: number;
  city?: string;
}

const WeatherChart: React.FC<WeatherChartProps> = ({
  data,
  title,
  loading,
  height = 500,
  city = "Unknown",
}) => {
  const options: ApexOptions = {
    chart: {
      type: "candlestick",
      height: height,
      toolbar: {
        show: true,
        tools: {
          download: false,
          selection: true,
          zoom: false,
          zoomin: true,
          zoomout: true,
          pan: false,
          reset: true,
        },
      },
      background: "#ffffff",
    },
    noData: { text: loading ? "Loading..." : "No Data Available" },
    title: {
      text: title || `Hourly Temperature - ${city}`,
      align: "left",
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        color: "#333",
      },
    },
    subtitle: {
      text: `Aggregated hourly temperature data`,
      align: "left",
      style: {
        fontSize: "12px",
        color: "#666",
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        style: {
          colors: "#666",
          fontSize: "12px",
        },
        format: "HH:mm",
      },
    },
    yaxis: {
      title: {
        text: "Temperature (°C)",
        style: {
          color: "#666",
          fontSize: "12px",
        },
      },
      labels: {
        style: {
          colors: "#666",
          fontSize: "12px",
        },
        formatter: (value) => `${value.toFixed(1)}°C`,
      },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: "#00B746", // Green for temperature increase
          downward: "#EF403C", // Red for temperature decrease
        },
        wick: {
          useFillColor: true,
        },
      },
    },
    grid: {
      borderColor: "#f1f1f1",
      strokeDashArray: 4,
    },
    tooltip: {
      custom: ({ dataPointIndex }) => {
        const dataPoint = data[dataPointIndex];
        const [open, high, low, close] = dataPoint.y;
        const date = new Date(dataPoint.x).toLocaleString();

        return `
          <div style="padding: 12px; background: white; border: 1px solid #ccc; border-radius: 6px; font-family: Arial, sans-serif;">
            <div style="font-weight: bold; margin-bottom: 8px; color: #333;">${date}</div>
   
            <div style="margin-bottom: 4px;">Open: <strong>${open.toFixed(
              1
            )}°C</strong></div>
            <div style="margin-bottom: 4px;">High: <strong style="color: #00B746;">${high.toFixed(
              1
            )}°C</strong></div>
            <div style="margin-bottom: 4px;">Low: <strong style="color: #EF403C;">${low.toFixed(
              1
            )}°C</strong></div>
            <div style="margin-bottom: 4px;">Close: <strong>${close.toFixed(
              1
            )}°C</strong></div>
            <div style="font-size: 11px; color: #888;">Data points: ${
              dataPoint.dataPoints
            }</div>
          </div>
        `;
      },
    },
    annotations: {
      yaxis: [
        {
          y: 0,
          borderColor: "#3498db",
          label: {
            text: "Freezing Point",
            style: {
              color: "#3498db",
              background: "#3498db",
            },
          },
        },
      ],
    },
  };

  const series = [
    {
      name: "Temperature",
      data: data,
    },
  ];

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#fafafa",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        margin: "10px 0",
        minHeight: height + 40, // Ensure consistent height
      }}
    >
      <Chart
        options={options}
        series={series}
        type="candlestick"
        height={height}
      />
    </div>
  );
};

export default WeatherChart;
