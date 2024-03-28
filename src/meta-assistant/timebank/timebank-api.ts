import { WeeklyCombinedData } from "src/types/meta-assistant/index";
import { Person, DailyEntriesApi, PersonsApi, DailyEntry, Timespan, PersonTotalTime } from "src/generated/client/api";
import { DateTime } from "luxon";

/**
 * Namespace for Timebank API
 */
namespace TimebankApi {
  export const personsClient = new PersonsApi(process.env.TIMEBANK_BASE_URL);
  export const dailyEntriesClient = new DailyEntriesApi(process.env.TIMEBANK_BASE_URL);

  /**
   * Get list of timebank users from TimeBank API
   *
   * @returns valid persons data
   * @param keycloak access token
   */
  export const getTimebankUsers = async (accessToken: string): Promise<Person[]> => {
    try {
      const request = await personsClient.listPersons(true, {
        headers:
          { "Authorization": `Bearer ${accessToken}` }
      });

      if (request.response.statusCode === 200) {
        return request.body;
      }

      throw new Error("Error while loading Persons from Timebank");
    } catch (error) {
      console.error(error.toString());
    }
  };

  /**
   * Get time entries for specific timebank user
   *
   * @param id from persons data
   * @param before string for timebank dates
   * @param after string for timebank dates
   * @returns Array of time entries for person
   * @param accessToken string for timebank accessToken
   */
  export const getDailyEntries = async (id: number, beforeDate: DateTime, afterDate: DateTime, accessToken: string): Promise<DailyEntry> => {
    try {
      const before = beforeDate.toISODate();
      const after = afterDate.toISODate();
      if (!id) throw new Error("Invalid ID was given (expecting a number)");

      const request = await dailyEntriesClient.listDailyEntries(id, before, after, undefined, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });

      if (request.response.statusCode === 200) {
        return request.body[0];
      }

      throw new Error(`Error while loading DailyEntries for person ${id} from Timebank`);
    } catch (error) {
      console.error(error.toString());
    }
  };

  /**
   * Get totals time entries for user for specific time period
   *
   * @param timePeriod of time data to sum
   * @param person person data from timebank
   * @param year of data to request
   * @param week of data to request
   * @param month of data to request
   * @param accessToken of data to request
   * @returns total time data with user name
   */
  export const getPersonTotalEntries = async (
    timespan: Timespan,
    person: Person,
    year: number,
    month: number,
    week: number,
    accessToken: string
  ): Promise<WeeklyCombinedData> => {
    try {
      let filteredWeeks: PersonTotalTime[];

      if (!person.id) throw new Error("No ID on person");

      const request = await personsClient.listPersonTotalTime(person.id, timespan, undefined, undefined, {
        headers:
          { "Authorization": `Bearer ${accessToken}` }
      });

      if (request.response.statusCode === 200) {
        filteredWeeks = request.body.filter(personTotalTime => personTotalTime.timePeriod === `${year},${month},${week}`);
      } else {
        throw new Error(`Error while loading PersonTotalTimes for person ${person.id} from Timebank`);
      }

      if (filteredWeeks.length > 1) throw new Error("Found more than one PersonTotalTime for given year and week");

      const selectedWeek = filteredWeeks[0];
      const { firstName, lastName } = person;
      const combinedName = `${firstName} ${lastName}`;

      return {
        selectedWeek: selectedWeek,
        name: combinedName,
        firstName: person.firstName,
        personId: person.id,
        expected: person.monday,
        minimumBillableRate: person.minimumBillableRate
      };
    } catch (error) {
      console.error(error.toString());
    }
  };
}

export default TimebankApi;