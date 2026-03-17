import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "get",
        path: "/google-drive/memo-content",
        authorizer: {
          name: "homeKeycloakAuthorizer"
        }
      }
    }
  ]
};
