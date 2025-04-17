import { S3 } from "aws-sdk";
import fetch from "node-fetch";
import { DateTime } from "luxon";
import S3Utils from "@libs/s3-utils";
import Config from "src/app/config";
const getNextWeekFromSchedule = (schedule, nextThursday, policyName) => {
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
export const weeklyCheckHandler = async () => {
    const { apiId, apiKey, schedulePolicyName, teamOnCallUrl } = Config.get().splunkApi;
    const splunkTeamOnCallUrl = teamOnCallUrl;
    const schedule = await (await fetch(`${splunkTeamOnCallUrl}/schedule?daysForward=4&daysSkip=3`, {
        headers: {
            'X-VO-Api-Id': apiId,
            'X-VO-Api-Key': apiKey,
            'Accept': 'application/json'
        }
    })).json();
    const nextThursday = DateTime.now().plus({ days: 4 });
    const nextWeek = getNextWeekFromSchedule(schedule, nextThursday, schedulePolicyName);
    if (!nextWeek) {
        throw new Error("Next week not found");
    }
    const yearFile = `${nextThursday.year}.json`;
    const s3 = new S3();
    const bucket = Config.get().onCall.bucketName;
    const yearJson = (await S3Utils.loadJson(s3, bucket, yearFile)) || [];
    const selectedWeekIndex = yearJson.findIndex(entry => entry.Week == nextWeek.week);
    if (selectedWeekIndex > -1) {
        yearJson[selectedWeekIndex].Person = nextWeek.user;
    }
    else {
        yearJson.push({
            Week: nextWeek.week,
            Person: nextWeek.user
        });
    }
    await S3Utils.saveJson(s3, bucket, yearFile, yearJson);
    return {
        statusCode: 200,
        body: JSON.stringify(nextWeek)
    };
};
export const main = weeklyCheckHandler;
//# sourceMappingURL=handler.js.map