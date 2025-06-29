export const schedulerConfig = {
  // How often to run aggregation (in minutes)
  intervalMinutes: parseInt(process.env.SCHEDULER_INTERVAL_MINUTES || "15"),
  
  // Cities to aggregate data for
  cities: process.env.SCHEDULER_CITIES?.split(',') || [
    'Berlin', 
    'NewYork', 
    'Tokyo', 
    'SaoPaulo', 
    'CapeTown'
  ],
  
  // Whether scheduler is enabled
  enabled: process.env.SCHEDULER_ENABLED !== "false",
  
  // Time window for aggregation in hours (how far back to look for data)
  aggregationTimeWindowHours: parseInt(process.env.SCHEDULER_TIME_WINDOW_HOURS || "24"),
} as const;

export type SchedulerConfig = typeof schedulerConfig;
