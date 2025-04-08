import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "get",
        path: "/admin/users",
        authorizer: {
          name: "homeKeycloakAuthorizer",
        },
      },
    },
    {
      httpApi: {
        method: "put",
        path: "/admin/users/{userId}/vacation",
        authorizer: {
          name: "homeKeycloakAuthorizer",
        },
      },
    },
    {
      httpApi: {
        method: "options",
        path: "/admin/users",
      },
    },
    {
      httpApi: {
        method: "options",
        path: "/admin/users/{userId}/vacation",
      },
    }
  ],
};