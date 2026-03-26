import { handlerPath } from "src/libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "put",
        path: "users/{userId}/status"
      }
    }
  ]
};
