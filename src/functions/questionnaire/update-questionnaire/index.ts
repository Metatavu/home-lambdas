import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "put",
        path: "/questionnaires/{id}",
        authorizer: {
          name: "homeKeycloakAuthorizer",
        },
      },
    },
  ],
};