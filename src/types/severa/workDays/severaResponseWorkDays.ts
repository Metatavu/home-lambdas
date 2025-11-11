/**
 * Interface for Severa Response Work Days.
 */
interface SeveraResponseWorkDays {
  date: string;
  userGuid: string;
  expectedHours: number;
  enteredHours: number;
  enteredTimeEntries: number;
  isHoliday: boolean;
}

export default SeveraResponseWorkDays;
