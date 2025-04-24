import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "put",
        path: "/users/{userId}/vacation",
        authorizer: {
          name: "homeKeycloakAuthorizer",
        },
      },
    },
    {
      httpApi: {
        method: "options",
        path: "/users/{userId}/vacation",
      },
    },
  ],
};
