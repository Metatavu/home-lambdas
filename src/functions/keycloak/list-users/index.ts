import { handlerPath } from "src/libs/handler-resolver";

// NOTE: This lambda is marked as inactive in the OpenAPI spec (x-status: inactive).
const isInactive = false;

export default isInactive
  ? {}
  : {
      handler: `${handlerPath(__dirname)}/handler.main`,
      events: [
        {
          httpApi: {
            method: "get",
            path: "/users",
            authorizer: {
              name: "homeKeycloakAuthorizer"
            }
          }
        }
      ]
    };
