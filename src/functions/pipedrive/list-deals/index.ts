// NOTE: This lambda is deprecated and should not be in use

import { handlerPath } from "@libs/handler-resolver";

const isInactive = process.env.SKIP_INACTIVE_LAMBDAS === "true";

export default isInactive
  ? {}
  : {
      handler: `${handlerPath(__dirname)}/handler.main`,
      events: [
        {
      httpApi: {
        method: 'get',
        path: '/salesDeals/{status}',
        authorizer: {
          name: "homeKeycloakAuthorizer"
        }
      },
    },
  ],
}