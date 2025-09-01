import { DynamoDB} from "aws-sdk"
import fetch from "node-fetch";
import { DateTime } from "luxon";
import Config from "src/app/config";
import { SplunkSchedule } from "src/types/on-call";
import { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import { OnCallEntry } from "src/database/models/oncall";

/**
 * Resolve next week from schedule
 *
 * @param schedule schedule from Splunk
 * @param nextThursday Next thursday, DateTime of 4 days after scheduled function call
 * @param policyName name of policy
 * @returns week from schedule
 */
const getCurrentOnCallFromSchedule = (schedule: SplunkSchedule, currentDate: DateTime, policyName: string) => {
  const scheduleObj = schedule.schedules.find(schedule => schedule.policy.name === policyName)?.schedule[0];
  if (!scheduleObj || !scheduleObj.rolls) {
    return null;
  }
  
  const foundRoll = scheduleObj.rolls.find(roll => {
    const start = DateTime.fromISO(roll.start);
    const end = DateTime.fromISO(roll.end);
    return currentDate >= start && currentDate < end;
  });

  if (!foundRoll) {
    return null;
  }

  const onCallUser = foundRoll.onCallUser;
  const weekNumber = currentDate.weekNumber;
  console.log(foundRoll);
  console.log(`On call for week ${weekNumber} is ${onCallUser.username}`);

  return {
    week: weekNumber,
    user: onCallUser.username
  };
};

/**
 * Lambda for checking who is on call this week
 *
 * @param event event
 */
export const onCallWeeklyCheckHandler : ValidatedEventAPIGatewayProxyEvent<any> = async () => {
  const { apiId, apiKey, schedulePolicyName, teamOnCallUrl } = Config.get().splunkApi

  const splunkTeamOnCallUrl = teamOnCallUrl

  const schedule = await (await fetch(`${splunkTeamOnCallUrl}/schedule?daysForward=4&daysSkip=3`, {
    headers: {
      'X-VO-Api-Id': apiId,
      'X-VO-Api-Key': apiKey,
      'Accept': 'application/json'
    }
  })).json() as SplunkSchedule;

  const currentDate = DateTime.now();
  const splunkOnCallData = getCurrentOnCallFromSchedule(schedule, currentDate, schedulePolicyName);
  if (!splunkOnCallData) {
    throw new Error("Current week not found");
  }

  const dynamoDb = new DynamoDB.DocumentClient();

  console.log(`On call for week ${splunkOnCallData.week} of year ${currentDate.year} is ${splunkOnCallData.user}`);

  const entry: OnCallEntry = {
    Year: currentDate.year,
    Week: splunkOnCallData.week,
    Person: splunkOnCallData.user,
    Paid: false
  };

  // Update or create a new record in DynamoDB
  await dynamoDb.put({
    TableName: "OnCallSchedule",
    Item: entry
  }).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(splunkOnCallData)
  };
};

export const main = onCallWeeklyCheckHandler;