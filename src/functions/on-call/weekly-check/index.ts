import { handlerPath } from "@libs/handler-resolver";

// NOTE: This lambda is marked as inactive in the OpenAPI spec (x-status: inactive).
const isInactive = true;

const { ONCALL_WEEKLY_SCHEDULE_TIMER } = process.env;

export default isInactive
  ? {}
  : {
      handler: `${handlerPath(__dirname)}/handler.main`,
      events: [
        ...(ONCALL_WEEKLY_SCHEDULE_TIMER ? [
          {
            schedule: ONCALL_WEEKLY_SCHEDULE_TIMER,
          }
        ] : []),
      ]
    };
