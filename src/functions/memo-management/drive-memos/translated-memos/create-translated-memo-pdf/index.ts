import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      // httpApi: {
      //   method: "POST",
      //   path: "/translate-memo",
      //   authorizer: {
      //     name: "homeKeycloakAuthorizer"
      //   }
      // }
    }
  ]
};
