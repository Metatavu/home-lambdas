import { Dates, TimeRegistrations, PreviousWorkdayDates, NonProjectTime, DisplayValues } from "src/types/meta-assistant/index";
import { DateTime, Duration } from "luxon";
import { PersonTotalTime } from "src/generated/client/api";

/**
 * Namespace for time utilities
 */
namespace TimeUtilities {

  /**
   * Converts minutes into hours and minutes
   *
   * @param duration in minutes from timebank Data
   * @returns string of timebank data converted to hours and minutes
   */
  export const timeConversion = (duration: number): string => {
    const dur = Duration.fromObject({ minutes: duration });
    const time = dur.shiftTo("hours", "minutes");
    return time.toHuman();
  };

  /**
   * Generates dates and numbers for previous week
   *
   * @returns various date formats/ numbers for start and end of previous week
   */
  export const getlastWeeksDates = (): Dates => {
    const startOfWeek = DateTime.now().startOf("week");

    const weekStartDate = startOfWeek.minus({ weeks: 1 });
    const weekEndDate = startOfWeek.minus({ days: 1 });

    return { weekEndDate: weekEndDate, weekStartDate: weekStartDate };
  };

  /**
   * Handle formatting multiple time variables
   *
   * @param user data from timebank
   * @returns human friendly time formats
   */
  export const handleTimeFormatting = (user: PersonTotalTime): DisplayValues => {
    const { logged, expected, internalTime, balance, loggedProjectTime, billableProjectTime, nonBillableProjectTime } = user;

    const displayLogged = TimeUtilities.timeConversion(logged);
    const displayLoggedProject = TimeUtilities.timeConversion(loggedProjectTime);
    const displayExpected = TimeUtilities.timeConversion(expected);
    const displayDifference = TimeUtilities.timeConversion(balance);
    const displayBillableProject = TimeUtilities.timeConversion(billableProjectTime);
    const displayNonBillableProjectTime = TimeUtilities.timeConversion(nonBillableProjectTime);
    const displayInternal = TimeUtilities.timeConversion(internalTime);

    return {
      logged: displayLogged,
      loggedProject: displayLoggedProject,
      expected: displayExpected,
      difference: displayDifference,
      billableProject: displayBillableProject,
      nonBillableProject: displayNonBillableProjectTime,
      internal: displayInternal
    };
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

    if (!personsTimeRegistration) return false;

    return nonProjectTimes.map(nonProjectTime => nonProjectTime.id).includes(personsTimeRegistration.non_project_time);
  };

  /**
   * Gets two previous workdays
   *
   * @returns two previous workdays
   */
  export const getPreviousTwoWorkdays = (): PreviousWorkdayDates => {
    let today = DateTime.now();
    let dayOfWeek = new Date().getDay();

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