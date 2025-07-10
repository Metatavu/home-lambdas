import { handlerPath } from "@libs/handler-resolver";

const { ONCALL_WEEKLY_SCHEDULE_TIMER } = process.env;

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    ...(ONCALL_WEEKLY_SCHEDULE_TIMER ? [
      {
        schedule: ONCALL_WEEKLY_SCHEDULE_TIMER,
      }
    ] : []),
    {
      httpApi: {
        path: "/on-call/weekly-check",
        method: "get"
      }
    }
  ]
};