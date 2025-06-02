import type { Dates, TimeRegistrations, PreviousWorkdayDates, NonProjectTime, DisplayValues } from "src/types/meta-assistant/index";
import { DateTime, Duration } from "luxon";
import type { TotalTime } from "src/types/severa/totalTime/totalTime";

/**
 * Namespace for time utilities
 */
namespace TimeUtilities {

  /**
   * Converts minutes into hours and minutes
   *
   * @param duration in minutes from severa Data
   * @returns string of severa data converted to hours and minutes
   */
  export const timeConversion = (duration: number): string => {
    const dur = Duration.fromObject({ hours: duration });
    const time = dur.shiftTo("hours", "minutes");
    return time.toHuman();
  };

  /**
   * Generates dates and numbers for previous week
   *
   * @param date needed to specify week
   * @returns various date formats/ numbers for start and end of previous week
   */
  export const getlastWeeksDates = (date?: DateTime): Dates => {
    let startOfWeek = DateTime.now().startOf("week");
    if (date) {
      startOfWeek = date.startOf("week");
    }
    const weekStartDate = startOfWeek.minus({ weeks: 1 });
    const weekEndDate = startOfWeek.minus({ days: 1 });

    return { weekEndDate: weekEndDate, weekStartDate: weekStartDate };
  };

  /**
   * Handle formatting multiple time variables
   *
   * @param user data from severa
   * @returns human friendly time formats
   */
  export const handleTimeFormatting = (user: TotalTime): DisplayValues => {
    const { totalLoggedTime, expectedHours, projectTime, totalBillableTime, nonBillableProject } = user;

    const displayTotalLoggedTime = TimeUtilities.timeConversion(totalLoggedTime);
    const displayExpectedHours = TimeUtilities.timeConversion(expectedHours);
    const displayProjectTime = TimeUtilities.timeConversion(projectTime);
    const displayTotalBillableTime = TimeUtilities.timeConversion(totalBillableTime);
    const displayNonBillableProject = TimeUtilities.timeConversion(nonBillableProject);

    return {
      totalLoggedTime: displayTotalLoggedTime,
      expectedHours: displayExpectedHours,
      projectTime: displayProjectTime,
      totalBillableTime: displayTotalBillableTime,
      nonBillableProject: displayNonBillableProject
    };
  };

  /**
   * Checks if user has vacation periods in time allocation
   *
   * @param user data from severa
   * @returns human friendly time formats
   */
  export const checkIfVacationCaseExists = (
    personId: number,
    timeRegistrations: TimeRegistrations[],
    nonProjectTimes: NonProjectTime[],
    startDate: DateTime,
    endDate: DateTime
  ) => {  

    let totalNonProjectTime = 0;
    // Calculates total registered time allocated to non-project activities within the specified date range. Checks if the user has any non-project time.
    timeRegistrations.forEach((registration) => {
      const { date, time_registered, non_project_time, person } = registration;
      if (personId === person && nonProjectTimes.map(nonProjectTime => nonProjectTime.id).includes(non_project_time)) {
        if (DateTime.fromISO(date) >= startDate && DateTime.fromISO(date) <= endDate){
          totalNonProjectTime += time_registered;
        }    
      }
    });
    return totalNonProjectTime;
  }; 

  /**
   * Checks if user should receive message, not if off or is first day back
   *
   * @param timeRegistrations All timeregistrations after the day before yesterday
   * @param personId Users id
   * @param expected Users expected amount of work
   * @param date Today either yesterday depending on if function is checking is user on vacation or is it first day back at work
   * @param nonProjectTimes List of non project times
   * @returns false if can't find a time registration
   */
  export const checkIfUserShouldRecieveMessage = (
    timeRegistrations: TimeRegistrations[],
    personId: number,
    expected: number,
    date: string,
    nonProjectTimes: NonProjectTime[]
  ): boolean => {
    const personsTimeRegistration = timeRegistrations.find(timeRegistration =>
      timeRegistration.person === personId
      && timeRegistration.date === date
      && timeRegistration.time_registered === expected
    );

    if (!personsTimeRegistration) {
      return false;
    }

    return nonProjectTimes.map(nonProjectTime => nonProjectTime.id).includes(personsTimeRegistration.non_project_time);
  };

  /**
   * Gets two previous workdays
   *
   * @returns two previous workdays
   */
  export const getPreviousTwoWorkdays = (): PreviousWorkdayDates => {
    const today = DateTime.now();
    const dayOfWeek = new Date().getDay();

    let previousWorkDay = today.minus({ days: 1 });
    let dayBeforePreviousWorkDay = today.minus({ days: 2 });

    if (dayOfWeek === 1) {
      previousWorkDay = today.minus({ days: 3 });
      dayBeforePreviousWorkDay = today.minus({ days: 4 });
    }

    return {
      today: today,
      yesterday: previousWorkDay,
      numberOfToday: dayOfWeek,
      dayBeforeYesterday: dayBeforePreviousWorkDay
    };
  };
}

export default TimeUtilities;