import { handlerPath } from "@libs/handler-resolver";

export default {
	handler: `${handlerPath(__dirname)}/handler.main`,
	events: [
		{
			httpApi: {
				method: 'post',
				path: '/on-call/import-json',
				authorizer: {
					name: "homeKeycloakAuthorizer"
				},
				request: {
					parameters: {
						querystrings: {
							year: true
						}
					},
					contentType: 'application/json'
				}
			}
		}
	]
};
