import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "get",
        path: "/trello/board-members",
        authorizer: {
          name: "homeKeycloakAuthorizer"
        }
      }
    }
  ],
}