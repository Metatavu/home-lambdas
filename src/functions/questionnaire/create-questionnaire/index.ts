import { handlerPath } from "@libs/handler-resolver";

// NOTE: This lambda is marked as inactive in the OpenAPI spec (x-status: inactive).
const isInactive = true;

export default isInactive
  ? {}
  : {
      handler: `${handlerPath(__dirname)}/handler.main`,
      events: [
        {
          httpApi: {
            method: "post",
            path: "/questionnaires",
            authorizer: {
              name: "homeKeycloakAuthorizer",
            },
          },
        },
      ],
    };
