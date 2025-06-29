
export const inMemoryConfig = {
  maxHistoryPerCity: 200,
} as const;

export type InMemoryConfig = typeof inMemoryConfig;
