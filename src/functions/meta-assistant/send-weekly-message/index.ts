import { handlerPath } from "@libs/handler-resolver";

const { WEEKLY_SCHEDULE_TIMER } = process.env;

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: WEEKLY_SCHEDULE_TIMER ? [
    {
      schedule: WEEKLY_SCHEDULE_TIMER,
    }
  ] : []
};