import { NonProjectTime, TimeRegistrations } from "src/types/meta-assistant/index";
import fetch, { Headers } from "node-fetch";
import { DateTime } from "luxon";

/**
 * Namespace for forecast-api
 */
namespace ForecastApiUtilities {
  const header ={
    "X-FORECAST-API-KEY": process.env.FORECAST_API_KEY
  };

  const headers = new Headers(header);

  /**
   * Gets non project time types from forecast
   *
   * @returns All non project times where is_internal_time is false
   */
  export const getNonProjectTime = async (): Promise<NonProjectTime[]> => {
    try {
      const request: any = await fetch(`${process.env.FORECAST_BASE_URL}/v1/non_project_time`, { headers: headers });
      const result: any = await request.json();

      if (request.status !== 200) throw new Error(result.message);

      return result.filter(nonProjectTime => !nonProjectTime.is_internal_time);
    } catch (error) {
      throw new Error(`Error while loading non project times, ${error.message}`);
    }
  };

  /**
   * Get all allocations after yesterday
   *
   * @param date the day before yesterday
   * @returns all allocations after yesterday
   */
  export const getTimeRegistrations = async (dateTime: DateTime): Promise<TimeRegistrations[]> => {
    try {
      let date = dateTime.toISODate();
      const dateUrl = date.replace(/[-]/g, "");
      const request: any = await fetch(`${process.env.FORECAST_BASE_URL}/v3/time_registrations?date_after=${dateUrl}`, { headers: headers });
      const result: any = await request.json();

      if (request.status !== 200) throw new Error(result.message);

      return result.filter(timeRegistration => timeRegistration.non_project_time);
    } catch (error) {
      if (error instanceof TypeError) {
        throw error;
      }
      throw new Error(`Error while loading time registrations, ${error.message}`);
    }
  };
}

export default ForecastApiUtilities;