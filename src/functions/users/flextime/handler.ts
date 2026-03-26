import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";

/**
 * Type representing user with their flextime data.
 */
type UserWithFlextime = {
	user: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		attributes: {
			severaUserId: string;
			isActive: boolean;
		};
	};
	flextime: {
		totalFlextimeBalance: number;
		monthFlextimeBalance: number;
	};
};

/**
 * Lambda handler for listing users with their flextime data.
 * Only returns users who have opted in to Severa integration.
 *
 * @param event - API Gateway proxy event containing query parameters
 * @returns Promise resolving to API Gateway proxy result with user flextime data
 */
export const listUsersFlextimeHandler: APIGatewayProxyHandler = async () => {
	try {
		const api = CreateSeveraApiService();
		const keycloakApi = CreateKeycloakApiService();
		const optedInUsers = await api.getOptInUsers();
		const keycloakUsers = await keycloakApi.getUsers();
		if (!optedInUsers || optedInUsers.length === 0) {
			return {
				statusCode: 200,
				body: JSON.stringify([]),
			};
		}
		const usersWithFlextime = await Promise.allSettled(
			optedInUsers.map(async (severaUser) => {
				try {
					// This should be typed according to the spec response type from the severa general spec generated client
					const flextime = await api.getFlextimeBySeveraUserId(severaUser.guid);
					const keycloakUser = keycloakUsers.find(
						(user) => user.attributes?.severaUserId?.[0] === severaUser.guid,
					);
					const isActive = keycloakUser?.attributes?.isActive?.[0] === "Active";

					return {
						user: {
							id: severaUser.guid,
							firstName: severaUser.firstName || "",
							lastName: severaUser.lastName || "",
							email: severaUser.email || "",
							attributes: {
								severaUserId: severaUser.guid,
								isActive: isActive || false,
							},
						},
						flextime: {
							totalFlextimeBalance: flextime?.totalFlextimeBalance || 0,
							monthFlextimeBalance: flextime?.monthFlextimeBalance || 0,
						},
					};
				} catch (error) {
					const statusCode =
						error instanceof Error && (error as any).statusCode
							? (error as any).statusCode
							: 500;
					return {
						statusCode,
						body: JSON.stringify({
							code: statusCode,
							message: `Failed to fetch flextime for user ${severaUser.guid}`,
							error: error instanceof Error ? error.message : "Unknown error",
						}),
					};
				}
			}),
		);
		/**
		 * Extract only the successful flextime results from the settled promises
		 */
		const successfulResults = usersWithFlextime
			.filter(
				(result): result is PromiseFulfilledResult<UserWithFlextime> =>
					result.status === "fulfilled",
			)
			.map((result) => result.value);
		return {
			statusCode: 200,
			body: JSON.stringify(successfulResults),
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				code: 500,
				message: "Internal server error",
				error: error instanceof Error ? error.message : "Unknown error",
			}),
		};
	}
};

/**
 * Main export with middleware wrapper for the users flextime handler.
 */
export const main = middyfy(listUsersFlextimeHandler);
