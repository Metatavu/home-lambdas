import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "GET",
        path: "/translate-memo/{id}/{language}",
        authorizer: {
          name: "homeKeycloakAuthorizer"
        }
      }
    }
  ]
};
