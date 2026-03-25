import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "post",
        path: "/articles/import-document",
        authorizer: {
          name: "homeKeycloakAuthorizer"
        }
      }
    }
  ]
};
