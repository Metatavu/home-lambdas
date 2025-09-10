import { handlerPath } from "@libs/handler-resolver";

// NOTE: This lambda is marked as inactive in the OpenAPI spec (x-status: active)
// If you want to deactivate it, you can set the SKIP_INACTIVE_LAMBDAS environment variable to "true"
const isInactive = process.env.SKIP_INACTIVE_LAMBDAS === "true";
export default isInactive
  ? {}
  : {
      handler: `${handlerPath(__dirname)}/handler.main`,
      events: [
        {
          httpApi: {
        method: 'get',
        path: '/slack-avatar',
        authorizer: {
          name: "homeKeycloakAuthorizer"
        }
      },
    },
  ],
}