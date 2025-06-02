import type { CalculateWorkedTimeAndBillableHoursResponse, DailyCombinedData } from "src/types/meta-assistant";
import TimeUtilities from "src/meta-assistant/generic/time-utils";
import type { TotalTime } from "src/types/severa/totalTime/totalTime";

/**
 * Namespace for message utilities
 */
namespace MessageUtilities {
  /**
   * Calculates worked time and billable hours
   *
   * @param user data from severa
   * @returns a message based on the worked time and the percentage of billable hours
   */
  export const calculateWorkedTimeAndBillableHours = (user: TotalTime| DailyCombinedData): CalculateWorkedTimeAndBillableHoursResponse => {
    const { totalLoggedTime, expectedHours, totalBillableTime } = user;

    const billableHoursPercentage = totalLoggedTime === 0 ? "0" : (totalBillableTime/totalLoggedTime * 100).toFixed(0);
    const totalOverTime = totalLoggedTime - expectedHours;

    const undertime = TimeUtilities.timeConversion(totalOverTime * -1);
    const overtime = TimeUtilities.timeConversion(totalOverTime);

    let message = "You worked the expected amount of time";
    if (totalOverTime > 0) {
      message = `Overtime: ${overtime}`;
    }

    if (totalOverTime < 0) {
      message = `Undertime: ${undertime}`;
    }

    return {
      message: message,
      billableHoursPercentage: billableHoursPercentage
    };
  };
}

export default MessageUtilities;