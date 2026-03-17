// NOTE: This lambda is deprecated and should not be in use

import { handlerPath } from "@libs/handler-resolver";

const isInactive = true;

export default isInactive
  ? {}
  : {
      handler: `${handlerPath(__dirname)}/handler.main`,
      events: [
        {
          httpApi: {
            method: 'PUT',
            path: '/addDealInterest/{dealId}',
            authorizer: {
              name: "homeKeycloakAuthorizer"
            }
          },
        },
      ],
    };