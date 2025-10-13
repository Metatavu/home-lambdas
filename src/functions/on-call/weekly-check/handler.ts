import fetch from "node-fetch";
import { DateTime } from "luxon";
import Config from "src/app/config";
import { SplunkSchedule } from "src/types/on-call";
import { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import { OnCall } from "src/generated/homeLambdasModels/api";
import { OnCallEntry } from "src/database/models/oncall";
import { onCallScheduleService } from "src/database/services";

/**
 * Resolve next week from schedule
 *
 * @param schedule schedule from Splunk
 * @param nextThursday Next thursday, DateTime of 4 days after scheduled function call
 * @param policyName name of policy
 * @returns week from schedule
 */
const getNextWeekFromSchedule = (schedule: SplunkSchedule, nextThursday: DateTime, policyName: string) => {
  const scheduleFromSplunk = schedule.schedules.find(schedule => schedule.policy.name === policyName)?.schedule[0];
  if (!scheduleFromSplunk) {
    return null;
  }

  const onCallUser = scheduleFromSplunk.onCallUser;
  const overrideOnCallUser = scheduleFromSplunk.overrideOnCallUser;
  const weekNumber = nextThursday.weekNumber;

  return {
    week: weekNumber,
    user: overrideOnCallUser == null ? onCallUser.username : overrideOnCallUser.username
  };
};

/**
 * Lambda for checking who is on call this week
 *
 * @param event event
 */
export const onCallWeeklyCheckHandler : ValidatedEventAPIGatewayProxyEvent<OnCall> = async () => {
  const { apiId, apiKey, schedulePolicyName, teamOnCallUrl } = Config.get().splunkApi

  const splunkTeamOnCallUrl = teamOnCallUrl

  const schedule = await (await fetch(`${splunkTeamOnCallUrl}/schedule?daysForward=4&daysSkip=3`, {
    headers: {
      'X-VO-Api-Id': apiId,
      'X-VO-Api-Key': apiKey,
      'Accept': 'application/json'
    }
  })).json() as SplunkSchedule;

  const nextThursday = DateTime.now().plus({ days: 4 });
  const nextWeek = getNextWeekFromSchedule(schedule, nextThursday, schedulePolicyName);
  if (!nextWeek) {
    throw new Error("Next week not found");
  }

  const year = nextThursday.year;
  const week = nextWeek.week;
  const user = nextWeek.user;

  const entry: OnCallEntry = {
    Year: year,
    Week: week,
    Username: user,
    Paid: false
  };

  await onCallScheduleService.upsertOnCallSchedule(entry);

  return {
    statusCode: 200,
    body: JSON.stringify(nextWeek)
  };
};

export const main = onCallWeeklyCheckHandler;