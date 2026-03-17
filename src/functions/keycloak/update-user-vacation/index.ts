import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "put",
        path: "/users/{userId}/vacationDays",
        authorizer: {
          name: "homeKeycloakAuthorizer",
        },
      },
    },
  ],
};
