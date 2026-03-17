import { handlerPath } from "@libs/handler-resolver";

// NOTE: This lambda is marked as inactive in the OpenAPI spec (x-status: inactive).
const isInactive = true;

export default isInactive
  ? {}
  : {
      handler: `${handlerPath(__dirname)}/handler.main`,
      timeout: 30,
      events: [
        {
          httpApi: {
            method: "get",
            path: "/severa/users/flextime",
            authorizer: {
              name: "homeKeycloakAuthorizer"
            }
          }
        }
      ]
    };
