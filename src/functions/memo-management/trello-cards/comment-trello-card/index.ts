import { handlerPath } from "@libs/handler-resolver";

// NOTE: This lambda is marked as inactive in the OpenAPI spec (x-status: inactive).
const isInactive = process.env.SKIP_INACTIVE_LAMBDAS === "true";

export default isInactive
  ? {}
  : {
      handler: `${handlerPath(__dirname)}/handler.main`,
      events: [
        {
          httpApi: {
            method: "post",
            path: "/trello/card-comments",
            authorizer: {
              name: "homeKeycloakAuthorizer"
            }
          }
        }
      ],
    };