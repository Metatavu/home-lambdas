import { handlerPath } from "@libs/handler-resolver";

export default {
	handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "get",
        path: "/severa/flextime/{severaGuid}",
        authorizer: {
          name: "timebankKeycloakAuthorizer"
        }
      },
    },
  ],
};