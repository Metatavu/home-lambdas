import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "get",
        path: "/admin/users", // GET all users
        authorizer: {
          name: "homeKeycloakAuthorizer",
        },
      },
    },
    {
      httpApi: {
        method: "get",
        path: "/admin/users/{userId}", // NEW ROUTE for fetching a single user by ID
        authorizer: {
          name: "homeKeycloakAuthorizer",
        },
      },
    },
    {
      httpApi: {
        method: "put",
        path: "/admin/users/{userId}/vacation", // PUT for updating vacation data
        authorizer: {
          name: "homeKeycloakAuthorizer",
        },
      },
    },
    {
      httpApi: {
        method: "options",
        path: "/admin/users", // CORS OPTIONS for GET /admin/users
      },
    },
    {
      httpApi: {
        method: "options",
        path: "/admin/users/{userId}", // CORS OPTIONS for GET /admin/users/{userId}
      },
    },
    {
      httpApi: {
        method: "options",
        path: "/admin/users/{userId}/vacation", // CORS OPTIONS for PUT /admin/users/{userId}/vacation
      },
    },
  ],
};
