import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";

export const updateUserStatusHandler: APIGatewayProxyHandler = async (
	event,
) => {
	try {
		const userId = event.pathParameters?.userId;
		const body =
			typeof event.body === "string"
				? JSON.parse(event.body)
				: event.body || {};
		const isActive = body.isActive;

		if (!userId || typeof isActive !== "boolean") {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: "Invalid request" }),
			};
		}

		const keycloakApi = CreateKeycloakApiService();

		if (isActive) {
			await keycloakApi.updateUserAttributes(userId, {
				isActive: ["Active"],
			});
		} else {
			await keycloakApi.removeUserAttribute(userId, "isActive");
		}

		return {
			statusCode: 200,
			body: JSON.stringify({ message: "User status updated" }),
		};
	} catch (error) {
		console.error("Error updating user status:", error);

		return {
			statusCode: 500,
			body: JSON.stringify({
				message: "Error updating user",
				error: error instanceof Error ? error.message : "Unknown error",
			}),
		};
	}
};

export const main = middyfy(updateUserStatusHandler);
