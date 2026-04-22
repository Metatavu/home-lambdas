import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: "delete",
        path: "/usersSkills/{id}",
        authorizer: {
          name: "homeKeycloakAuthorizer"
        }
      }
    }
  ]
};
