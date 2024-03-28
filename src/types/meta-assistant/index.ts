import { ChatPostMessageResponse } from "@slack/web-api/dist/response/ChatPostMessageResponse";
import { DateTime } from "luxon";
import { PersonTotalTime } from "src/generated/client/api";

/**
 * Serverless schema type
 */
export default {
  type: "object",
  properties: {
    name: { type: "string" }
  },
  required: ["name"]
} as const;

/**
 * DailyCombinedData interface
 */
export interface DailyCombinedData {
  name: string;
  firstName: string;
  personId: number;
  minimumBillableRate: number;
  expected: number;
  logged: number;
  loggedProjectTime: number;
  billableProjectTime: number;
  nonBillableProjectTime: number;
  internalTime: number;
  date: string;
  balance: number;
  slackId?: string;
}

/**
 * WeeklyCombinedData interface
 */
export interface WeeklyCombinedData {
  selectedWeek: PersonTotalTime;
  name: string;
  firstName: string;
  slackId?: string;
  personId: number;
  expected: number;
  minimumBillableRate: number;
}

/**
 * WeeklyFormattedTimebankData interface- for use in future weeklyBreakdown functionality
 */
export interface WeeklyBreakdownCombinedData {
  totals: DailyCombinedData;
  multiplePersonTimeEntries: DailyCombinedData[];
}

/**
 * Dates interface
 */
export interface Dates {
  weekStartDate: DateTime;
  weekEndDate: DateTime;
}

/**
* Interface for time registrations
*/
export interface TimeRegistrations {
  id: number;
  person: number;
  project?: number;
  non_project_time: number;
  time_registered: number;
  date: string;
  approval_status: string;
}
/**
 * Interface for dates
 */
export interface PreviousWorkdayDates {
  today: DateTime;
  yesterday: DateTime;
  numberOfToday: number;
  dayBeforeYesterday: DateTime;
}

/**
 * Interface for non project time
 */
export interface NonProjectTime {
  id: number;
  name: string;
  is_internal_time: boolean;
}

/**
 * Interface for Daily Message Data
 */
export interface DailyMessageData {
  message: string;
  name: string;
  displayDate?: string;
  displayLogged: string;
  displayLoggedProject: string;
  displayExpected: string;
  displayBillableProject: string;
  displayNonBillableProject: string;
  displayInternal: string;
  billableHoursPercentage: string;
}

/**
 * Interface for DisplayValues
 */
export interface DisplayValues {
  logged: string;
  loggedProject: string;
  expected: string;
  difference: string;
  billableProject: string;
  nonBillableProject: string;
  internal: string;
}

/**
 * Interface for calculateWorkedTimeAndBillableHours
 */
export interface CalculateWorkedTimeAndBillableHoursResponse {
  message: string;
  billableHoursPercentage: string;
}

/**
 * Interface for Weekly Message Data
 */
export interface WeeklyMessageData {
  message: string;
  name: string;
  week: number,
  startDate: string,
  endDate: string,
  displayLogged: string;
  displayLoggedProject: string;
  displayExpected: string;
  displayBillableProject: string;
  displayNonBillableProject: string;
  displayInternal: string;
  billableHoursPercentage: string;
}

/**
 * Interface for Weekly Message Result
 */
export interface WeeklyMessageResult {
  message: WeeklyMessageData;
  response: ChatPostMessageResponse;
}

/**
 * Interface for Daily Message Result
 */
export interface DailyMessageResult {
  message: DailyMessageData;
  response: ChatPostMessageResponse;
}

/**
 * Interface for Parsed Access Token
 */
export interface ParsedAccessToken {
  accessToken: string;
}