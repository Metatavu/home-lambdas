/**
 * Interface for the TotalTime object
 */
export interface TotalTime {
  expectedHours: number;
  projectTime: number;
  totalBillableTime: number;
  nonBillableProject: number;
  totalLoggedTime: number;
  minimumBillableRate: number;
}

/**
 * Interface for the TotalTimeWeekly object
 */
export interface TotalTimeWeekly {
  totalExpectedHours: number;
  totalEnteredHours: number;
  projectTime: number;
}