import { handlerPath } from "@libs/handler-resolver";

const { DAILY_SCHEDULE_TIMER } = process.env;

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: DAILY_SCHEDULE_TIMER ? [
    {
      schedule: DAILY_SCHEDULE_TIMER
    }
  ] : []
};