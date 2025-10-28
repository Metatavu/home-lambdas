/**
 * Interface for Severa Response Work Days.
 * date and isHoliday fields added so that function can find expected work week
 * for the logged in user
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
