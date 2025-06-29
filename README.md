# Candle Bars - Weather Data Visualization

A full-stack application that visualizes weather temperature data using candlestick charts (OHLC - Open, High, Low, Close format). The system collects real-time weather data, aggregates it into hourly intervals, and displays it through interactive charts.

## 🌟 Features

- **Real-time Weather Data Collection**: WebSocket-based weather data streaming
- **OHLC Aggregation**: Hourly temperature aggregation (Open, High, Low, Close)
- **Interactive Charts**: Candlestick charts with ApexCharts
- **Multi-city Support**: Track weather for multiple cities (Berlin, NewYork, Tokyo, SaoPaulo, CapeTown)
- **Time Range Selection**: View data from 1 hour to 1 year
- **Smart Data Management**: Pre-aggregated data with real-time fallback
- **Scheduler Service**: Automatic background data aggregation
- **RESTful API**: Comprehensive API with Swagger documentation

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  Frontend       │    │    Backend       │    │    Database         │
│  (React + TS)   │◄──►│  (Express + TS)  │◄──►│    (SQLite)         │
│                 │    │                  │    │                     │
│ • ApexCharts    │    │ • WebSocket      │    │ • Weather Events    │
│ • Time Controls │    │ • REST API       │    │ • OHLC Aggregates   │
│ • City Selector │    │ • Scheduler      │    │ • Indexes           │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## 📁 Project Structure

```
candle-bars/
├── backend/              # Express.js TypeScript server
│   ├── src/
│   │   ├── app.ts       # Main application entry
│   │   ├── configs/     # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── db/          # Database layer
│   │   │   ├── models/  # Data models
│   │   │   └── repositories/ # Data access layer
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utilities
│   ├── data/           # SQLite database
│   ├── docs/           # Documentation
│   └── scripts/        # Utility scripts
│
└── frontend/            # React TypeScript application
    ├── src/
    │   ├── App.tsx     # Main application component
    │   ├── api/        # API client
    │   ├── components/ # React components
    │   └── utils/      # Utilities
    └── public/         # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd candle-bars
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

### Environment Configuration

1. **Backend Environment**
   Create `.env` file in the backend directory:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_PATH=./data/weather.db
   WEATHER_SIMULATOR_URL=ws://localhost:8080
   ```

### Running the Application

1. **Start the Weather Simulator** (Terminal 1)
   ```bash
   cd backend
   npm run simulator
   ```
   This starts a WebSocket server that generates mock weather data for multiple cities. The simulator is essential for the application to function as it provides the real-time weather data stream that feeds into the OHLC aggregation system.

2. **Start the Backend Server** (Terminal 2)
   ```bash
   cd backend
   npm run dev
   ```

3. **Start the Frontend** (Terminal 3)
   ```bash
   cd frontend
   npm run dev
   ```

The application will be available at:
- Frontend: `http://localhost:4173` or dev `http://localhost:5173`
- Backend API: `http://localhost:3000`
- API Documentation: `http://localhost:3000/api-docs`

> **Note**: The weather simulator (`npm run simulator`) must be running before starting the backend server, as the backend connects to the simulator via WebSocket to receive weather data.

## 📊 Usage

### Frontend Features

- **City Selection**: Choose from 5 supported cities
- **Time Range Controls**: Select from predefined time ranges (1 hour to 1 year)
- **Interactive Charts**: 
  - Zoom and pan functionality
  - Detailed tooltips showing OHLC values
  - Temperature annotations (freezing point)
- **Real-time Updates**: Data refreshes when changing city or time range

### API Endpoints

#### Weather Data
- `GET /api/v1/weather/by-city` - Get weather OHLC data for a city
- `POST /api/v1/weather/aggregate/:city` - Manually trigger aggregation

#### Scheduler Management
- `GET /api/v1/scheduler/status` - Get scheduler status
- `POST /api/v1/scheduler/start` - Start the scheduler
- `POST /api/v1/scheduler/stop` - Stop the scheduler

#### Health & Monitoring
- `GET /health` - Health check endpoint

### Data Flow

1. **Weather Simulator** generates mock weather data via WebSocket
2. **Weather Service** collects and stores raw weather events
3. **Scheduler Service** periodically aggregates data into hourly OHLC format
4. **API** serves both pre-aggregated and real-time aggregated data
5. **Frontend** displays data using interactive candlestick charts

## 🛠️ Development

### Backend Technologies

- **Express.js**: Web framework
- **TypeScript**: Type-safe JavaScript
- **SQLite**: Lightweight database
- **WebSocket**: Real-time communication
- **Winston**: Logging
- **Swagger**: API documentation

### Backend Scripts

The backend includes several npm scripts for different purposes:

- **`npm run simulator`**: Starts the weather data simulator that generates mock weather events via WebSocket
- **`npm run dev`**: Starts the development server with hot reload using ts-node-dev
- **`npm run build`**: Compiles TypeScript to JavaScript in the dist/ directory
- **`npm start`**: Runs the compiled production server
- **`npm run watch`**: Compiles TypeScript in watch mode

> **Important**: Always run `npm run simulator` first before starting the backend server to ensure weather data is available.

### Frontend Technologies

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **ApexCharts**: Chart library
- **CSS3**: Styling

### Database Schema

#### Weather Events Table
```sql
CREATE TABLE weather_events (
  id INTEGER PRIMARY KEY,
  city TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  temperature REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(city, timestamp)
);
```

#### OHLC Aggregates Table
```sql
CREATE TABLE weather_hourly_ohlc (
  id INTEGER PRIMARY KEY,
  city TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(city, timestamp)
);
```

## 📈 Performance

### Optimization Features

- **Pre-aggregation**: Background scheduler reduces query time
- **Database Indexes**: Optimized for city and timestamp queries
- **Smart Fallback**: Uses pre-aggregated data when available, real-time when needed
- **Connection Pooling**: Efficient database connection management

### Monitoring

- **Logging**: Comprehensive logging with Winston
- **Health Checks**: Built-in health monitoring
- **Error Handling**: Graceful error handling throughout the stack

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm run build
npm start
```

### Frontend Testing
```bash
cd frontend
npm run build
npm run start
```

## 📚 API Documentation

Full API documentation is available at `http://localhost:3000/api-docs` when the backend is running.

### Example API Calls

```bash
# Get weather data for Berlin (last 24 hours)
curl "http://localhost:3000/api/v1/weather/by-city?city=Berlin"

# Get weather data for a specific date range
curl "http://localhost:3000/api/v1/weather/by-city?city=Berlin&startDate=2024-06-29T16:05:40.890Z&endDate=2025-06-29T16:05:40.890Z"

# Check scheduler status
curl "http://localhost:3000/api/v1/scheduler/status"
```

## 🔧 Configuration

### Scheduler Configuration

The scheduler can be configured in `src/configs/scheduler.ts`:

```typescript
{
  intervalMinutes: 15,           // How often to run aggregation
  cities: ['Berlin', 'NewYork'], // Which cities to aggregate
  enabled: true,                 // Enable/disable scheduler
  aggregationTimeWindowHours: 24 // How far back to aggregate
}
```

### Chart Configuration

Charts can be customized in `frontend/src/components/WeatherChart.tsx` using ApexCharts options.

## 🚀 Deployment

### Production Build

1. **Backend Production Build**
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Frontend Production Build**
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

### Environment Variables

For production, ensure proper environment variables are set:
- Database path
- CORS origins
- Logging levels
- WebSocket URLs

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Ensure SQLite database path is correct
   - Check file permissions

2. **WebSocket Connection Failed**
   - Verify weather simulator is running
   - Check WebSocket URL in configuration

3. **Frontend API Calls Failing**
   - Ensure backend is running on correct port
   - Check CORS configuration

### Logs

- Backend logs: `backend/logs/`
- Frontend errors: Browser console :)


### TODO

- Data validation is mostly missing (add schemas, prevent SQL injections)
- Implement testing 
- Replace In memory storage
- Chart realtime updates (plain Sockets / GraphQL subscriptions / pooling)


## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.