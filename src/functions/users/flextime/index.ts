import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 30,
  events: [
    {
      httpApi: {
        method: "get",
        path: "/users/flextime",
        authorizer: {
          name: "homeKeycloakAuthorizer"
        }
      }
    }
  ]
};