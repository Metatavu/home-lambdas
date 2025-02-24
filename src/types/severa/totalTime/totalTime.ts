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

export interface TotalTimeWeekly {
  totalExpectedHours: number;
  totalEnteredHours: number;
  projectTime: number;
}