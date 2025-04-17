import { handlerPath } from "@libs/handler-resolver";
export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            httpApi: {
                method: "post",
                path: "/vacationRequests",
                authorizer: {
                    name: "homeKeycloakAuthorizer",
                },
            },
        },
    ],
};
//# sourceMappingURL=index.js.map