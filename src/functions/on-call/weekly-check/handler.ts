import { DateTime } from "luxon";
import fetch from "node-fetch";
import Config from "src/app/config";
import type OnCallEntry from "src/database/models/oncall";
import { onCallScheduleService } from "src/database/services";
import type { OnCall } from "src/generated/homeLambdasModels/model/onCall";
import type { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import { getUserEmail } from "src/services/on-call-service";
import type { SplunkSchedule } from "src/types/on-call";

/**
 * Resolve next week from schedule
 *
 * @param schedule schedule from Splunk
 * @param nextThursday Next thursday, DateTime of 4 days after scheduled function call
 * @param policyName name of policy
 * @returns week from schedule
 */
const getNextWeekFromSchedule = (
  schedule: SplunkSchedule,
  nextThursday: DateTime,
  policyName: string
) => {
  const scheduleFromSplunk = schedule.schedules.find(
    (schedule) => schedule.policy.name === policyName
  )?.schedule[0];
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
export const onCallWeeklyCheckHandler: ValidatedEventAPIGatewayProxyEvent<OnCall> = async () => {
  const { apiId, apiKey, schedulePolicyName, teamOnCallUrl } = Config.get().splunkApi;

  const splunkTeamOnCallUrl = teamOnCallUrl;

  const schedule = (await (
    await fetch(`${splunkTeamOnCallUrl}/schedule?daysForward=4&daysSkip=3`, {
      headers: {
        "X-VO-Api-Id": apiId,
        "X-VO-Api-Key": apiKey,
        Accept: "application/json"
      }
    })
  ).json()) as SplunkSchedule;

  const nextThursday = DateTime.now().plus({ days: 4 });
  const nextWeek = getNextWeekFromSchedule(schedule, nextThursday, schedulePolicyName);
  if (!nextWeek) {
    throw new Error("Next week not found");
  }

  const year = nextThursday.year;
  const week = nextWeek.week;
  const user = nextWeek.user;

  const email = await getUserEmail(user);

  const entry: OnCallEntry = {
    Year: year,
    Week: week,
    Username: user,
    Email: email || null,
    Paid: false
  };

  await onCallScheduleService.upsertSplunkOnCallSchedule(entry);

  return {
    statusCode: 200,
    body: JSON.stringify(nextWeek)
  };
};

export const main = onCallWeeklyCheckHandler;
