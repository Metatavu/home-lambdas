import { handlerPath } from "@libs/handler-resolver";
export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            httpApi: {
                method: "get",
                path: "/google-drive/memo-summary",
                authorizer: {
                    name: "homeKeycloakAuthorizer"
                }
            }
        }
    ],
};
//# sourceMappingURL=index.js.map