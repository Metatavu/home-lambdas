import { handlerPath } from "@libs/handler-resolver";

export default {
	handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "get",
        path: "/users/{userId}/flextime",
        authorizer: {
          name: "homeKeycloakAuthorizer"
        }
      },
    },
  ],
};