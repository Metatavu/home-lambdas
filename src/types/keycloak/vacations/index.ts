export interface VacationDayEntry {
    total: number;
    remaining: number;
  }
  
  export interface VacationDays {
    [year: string]: VacationDayEntry;
  }