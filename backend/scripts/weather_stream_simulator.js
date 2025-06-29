const WebSocket = require("ws");

const WITH_API_CALL = false;
const PORT = 8765;
const EVENTS_PER_SECOND = 20;
const INTERVAL_MS = 1000 / EVENTS_PER_SECOND;
const cities = {
  Berlin: [52.52, 13.41],
  NewYork: [40.71, -74.01],
  Tokyo: [35.68, 139.69],
  SaoPaulo: [23.55, -46.63],
  CapeTown: [-33.92, 18.42],
};

const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`🌍 Weather WebSocket server running at ws://localhost:${PORT}`);
});

wss.on("connection", (ws) => {
  console.log("🟢 Client connected");
  console.log(`EVENTS_PER_SECOND: ${EVENTS_PER_SECOND}`);

  const interval = setInterval(async () => {
    const cityNames = Object.keys(cities);
    const city = cityNames[Math.floor(Math.random() * cityNames.length)];
    const [lat, lon] = cities[city];

    if (!WITH_API_CALL) {
      const event = mockResults(city);
      ws.send(JSON.stringify(event));

      return;
    }

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      const data = await response.json();

      if (data.error) {
        console.error("Error fetching weather data:", data.reason);

        const event = mockResults(city);

        ws.send(JSON.stringify(event));

        return;
      }

      const weather = data.current_weather;

      if (!weather) {
        console.debug({ weather });
      }

      if (weather) {
        const event = {
          city,
          timestamp: weather.time,
          temperature: weather.temperature,
          windspeed: weather.windspeed,
          winddirection: weather.winddirection,
        };
        ws.send(JSON.stringify(event));
      }
    } catch (err) {
      console.error("Error fetching weather data:", err.message);
    }
  }, INTERVAL_MS);

  ws.on("close", () => {
    console.log("🔴 Client disconnected");
    clearInterval(interval);
  });
});

function mockResults(city) {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 16); // Format: 2025-06-29T14:30

  // City-specific base temperatures and characteristics (in Celsius)
  const cityClimate = {
    Berlin: { baseTemp: 15, tempRange: 25, windBase: 12 },
    NewYork: { baseTemp: 18, tempRange: 30, windBase: 10 },
    Tokyo: { baseTemp: 20, tempRange: 28, windBase: 8 },
    SaoPaulo: { baseTemp: 22, tempRange: 15, windBase: 6 },
    CapeTown: { baseTemp: 17, tempRange: 20, windBase: 15 },
  };

  const climate = cityClimate[city] || cityClimate.Berlin;

  // Time-based temperature variation (simulate day/night cycle)
  const hour = now.getHours();
  const timeOfDayFactor = 0.5 + 0.5 * Math.sin(((hour - 6) * Math.PI) / 12); // Peak at 6pm, minimum at 6am

  // Add some randomness for realistic variation
  const randomFactor = 0.8 + 0.4 * Math.random(); // Random factor between 0.8 and 1.2

  // Calculate realistic temperature
  const temperature =
    Math.round(
      (climate.baseTemp + climate.tempRange * timeOfDayFactor * randomFactor) *
        10
    ) / 10;

  // Generate realistic wind speed (0-30 km/h with city-specific base)
  const windspeed =
    Math.round(climate.windBase * (0.5 + 0.8 * Math.random()) * 10) / 10;

  // Generate wind direction (0-360 degrees)
  const winddirection = Math.floor(Math.random() * 360);

  return {
    city,
    timestamp,
    temperature,
    windspeed,
    winddirection,
  };
}
