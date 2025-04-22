import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "put",
        path: "/keyusers/{userId}/vacation",
        authorizer: {
          name: "homeKeycloakAuthorizer",
        },
      },
    },
    {
      httpApi: {
        method: "options",
        path: "/keyusers/{userId}/vacation",
      },
    },
  ],
};
