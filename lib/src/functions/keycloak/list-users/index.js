import { handlerPath } from "src/libs/handler-resolver";
export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            httpApi: {
                method: "get",
                path: "/users",
                authorizer: {
                    name: "homeKeycloakAuthorizer"
                }
            }
        }
    ]
};
//# sourceMappingURL=index.js.map