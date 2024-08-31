import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: 'get',
        path: '/software/{id}',
        authorizer: {
          name: "timebankKeycloakAuthorizer"
        }
      },
    },
  ],
};
