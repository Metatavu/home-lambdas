import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "get",
        path: "/keyusers/{userId}",
        authorizer: {
          name: "homeKeycloakAuthorizer",
        },
      },
    },
    {
      httpApi: {
        method: "options",
        path: "/keyusers/{userId}",
      },
    },
  ],
};
