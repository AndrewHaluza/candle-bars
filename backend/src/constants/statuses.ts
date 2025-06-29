export const STATUSES = {
  OK: "OK",
  ERROR: "ERROR",
} as const;

export type StatusType = (typeof STATUSES)[keyof typeof STATUSES];
