import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: 'PUT',
        path: '/removeLeadInterest/{leadId}',
        authorizer: {
          name: "homeKeycloakAuthorizer"
        }
      },
    },
  ],
}