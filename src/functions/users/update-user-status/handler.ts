import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
//import { UpdateUserAttribute } from "src/generated/homeLambdasModels/model/updateUserAttribute";
import { middyfy } from "src/libs/lambda";

export const updateUserStatusHandler: APIGatewayProxyHandler = async (
	event,
) => {
	try {
		const userId = event.pathParameters?.userId;
		const body = JSON.parse(event.body || "{}");

		const isActive = body.isActive;

		if (!userId || typeof isActive !== "boolean") {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: "Invalid request" }),
			};
		}
		const keycloakApi = CreateKeycloakApiService();

		await keycloakApi.updateUserAttributes(userId, {
			isActive: [String(isActive)],
		});
		return {
			statusCode: 200,
			body: JSON.stringify({ message: "User status updated" }),
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: " Error updating user",
				error: error instanceof Error ? error.message : "Unknown error",
			}),
		};
	}
};
export const main = middyfy(updateUserStatusHandler);
