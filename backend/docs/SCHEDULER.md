# Weather Data Aggregation Scheduler

This document describes the periodic aggregation scheduler that pre-computes weather OHLC (Open, High, Low, Close) data from raw weather events.

## Overview

The scheduler service automatically aggregates weather events into hourly OHLC format at regular intervals, improving query performance for chart data visualization.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  Weather Events │    │   Scheduler      │    │   OHLC Table        │
│  (Raw Data)     │───▶│   Service        │───▶│   (Aggregated)      │
│                 │    │                  │    │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## Key Components

### 1. SchedulerService (`src/services/schedulerService.ts`)

**Purpose**: Manages periodic execution of weather data aggregation

**Key Features**:
- Configurable interval timing
- Multi-city support
- Error handling and retry logic
- Start/stop controls
- Status monitoring

**Configuration Options**:
```typescript
{
  intervalMinutes: 15,           // How often to run aggregation
  cities: ['Berlin', 'NewYork'], // Which cities to aggregate
  enabled: true,                 // Enable/disable scheduler
  aggregationTimeWindowHours: 24 // How far back to aggregate data
}
```

### 2. AggregateService (`src/services/aggregateService.ts`)

**Purpose**: Performs the actual data aggregation logic

**Key Methods**:
- `preAggregateWeatherEvents()`: Aggregates and saves OHLC data
- `getAggregatedCandleBarsByCity()`: Real-time aggregation
- `getCandleBarsByCity()`: Smart method (pre-aggregated + fallback)

### 3. Database Schema

**Weather Events Table** (`weather_events`):
```sql
CREATE TABLE weather_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  temperature REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(city, timestamp)
);
```

**Weather Hourly OHLC Table** (`weather_hourly_ohlc`):
```sql
CREATE TABLE weather_hourly_ohlc (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(city, timestamp)
);
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Scheduler Configuration
SCHEDULER_ENABLED=true
SCHEDULER_INTERVAL_MINUTES=15
SCHEDULER_CITIES=Berlin,NewYork,Tokyo,SaoPaulo,CapeTown
SCHEDULER_TIME_WINDOW_HOURS=24
```

### Configuration File

See `src/configs/scheduler.ts`:

```typescript
export const schedulerConfig = {
  intervalMinutes: parseInt(process.env.SCHEDULER_INTERVAL_MINUTES || "15"),
  cities: process.env.SCHEDULER_CITIES?.split(',') || ['Berlin', 'NewYork'],
  enabled: process.env.SCHEDULER_ENABLED !== "false",
  aggregationTimeWindowHours: parseInt(process.env.SCHEDULER_TIME_WINDOW_HOURS || "24"),
};
```

## API Endpoints

The scheduler can be controlled via REST API:

### Get Scheduler Status
```bash
GET /api/v1/weather/status
```

**Response**:
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "config": {
      "intervalMinutes": 15,
      "cities": ["Berlin", "NewYork"],
      "enabled": true,
      "aggregationTimeWindowHours": 24
    },
    "nextRunTime": "2025-06-29T15:30:00.000Z"
  }
}
```

### Start Scheduler
```bash
POST /api/v1/weather/start
```

### Stop Scheduler
```bash
POST /api/v1/weather/stop
```

### Manual Aggregation for Specific City
```bash
POST /api/v1/weather/aggregate/:city

# Body (optional):
{
  "startDate": "2025-06-29T00:00:00Z",
  "endDate": "2025-06-29T23:59:59Z"
}
```

## Usage Examples

### 1. Starting the Scheduler Automatically

The scheduler starts automatically when the Weather Service connects:

```typescript
// In WeatherService.connect()
this.startScheduler();
```

### 2. Manual Control

```typescript
const scheduler = weatherService.getScheduler();

// Start manually
scheduler.start();

// Stop
scheduler.stop();

// Check status
const status = scheduler.getStatus();
console.log(`Running: ${status.isRunning}`);

// Aggregate specific city
await scheduler.aggregateCity('Berlin', startDate, endDate);
```

### 3. Configuration Updates

```typescript
scheduler.updateConfig({
  intervalMinutes: 30,  // Change to 30 minutes
  cities: ['Berlin']    // Only Berlin
});
```

## Monitoring and Logging

The scheduler provides comprehensive logging:

```
[SCHEDULER] Starting scheduler - will run every 15 minutes for cities: Berlin, NewYork
[SCHEDULER] Starting periodic aggregation...
[SCHEDULER] Successfully aggregated data for Berlin
[SCHEDULER] Aggregation completed - Success: 2, Failures: 0
```

### Log Levels:
- **INFO**: Scheduler start/stop, aggregation results
- **DEBUG**: Individual city aggregation details
- **WARN**: Configuration issues, aggregation failures
- **ERROR**: Critical errors

## Performance Considerations

### Benefits of Pre-aggregation:
1. **Fast Query Response**: Pre-computed OHLC data loads instantly
2. **Reduced CPU Load**: Aggregation happens in background
3. **Consistent Performance**: No real-time computation delays

### Resource Usage:
- **CPU**: Low - runs periodically, not continuously
- **Memory**: Minimal - processes cities one at a time
- **Disk**: OHLC table grows with ~1 record per city per hour

### Scaling Recommendations:
- **Small deployments**: 15-minute intervals
- **High-volume systems**: Consider longer intervals (30-60 minutes)
- **Many cities**: Implement city batching

## Error Handling

The scheduler includes robust error handling:

1. **Individual City Failures**: Other cities continue processing
2. **Database Errors**: Logged and retried on next cycle
3. **Service Crashes**: Auto-restart with application

```typescript
// Graceful error handling
const results = await Promise.allSettled(
  cities.map(city => aggregateService.preAggregateWeatherEvents(city))
);

results.forEach((result, index) => {
  if (result.status === 'rejected') {
    logger.error(`Aggregation failed for ${cities[index]}:`, result.reason);
  }
});
```

## Testing

### Manual Testing via API
```bash
# Check status
curl http://localhost:3000/api/v1/weather/status

# Start scheduler
curl -X POST http://localhost:3000/api/v1/weather/start

# Manual aggregation
curl -X POST http://localhost:3000/api/v1/weather/aggregate/Berlin
```

## Troubleshooting

### Common Issues:

1. **Scheduler Not Starting**
   - Check `SCHEDULER_ENABLED=true` in .env
   - Verify weather service connection
   - Check logs for connection errors

2. **No Data Being Aggregated**
   - Verify weather events are being stored
   - Check city names match exactly
   - Confirm time window includes recent data

3. **High Resource Usage**
   - Increase interval time
   - Reduce number of cities
   - Check for database connection issues

### Debug Mode:
Set log level to debug for detailed information:
```bash
LOG_LEVEL=debug npm run dev
```
