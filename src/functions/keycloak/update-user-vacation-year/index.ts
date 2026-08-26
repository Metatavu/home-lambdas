import { handlerPath } from "src/libs/handler-resolver";

const { YEARLY_SCHEDULE_TIMER } = process.env;

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: YEARLY_SCHEDULE_TIMER
    ? [
        {
          schedule: YEARLY_SCHEDULE_TIMER
        }
      ]
    : []
};
