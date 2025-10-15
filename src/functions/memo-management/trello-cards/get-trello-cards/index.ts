import { handlerPath } from "@libs/handler-resolver";

// NOTE: This lambda is marked as active in the OpenAPI spec (x-status: active)
const isInactive = true;

export default isInactive
  ? {}
  : {
      handler: `${handlerPath(__dirname)}/handler.main`,
      events: [
        {
          httpApi: {
        method: "get",
        path: "/trello/cards",
        authorizer: {
          name: "homeKeycloakAuthorizer"
        }
      }
    }
  ],
}