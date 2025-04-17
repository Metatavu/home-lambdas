import { middyfy } from "src/libs/lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import dotenv from "dotenv";
dotenv.config();
const keycloakApiService = CreateKeycloakApiService();
const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const vacationManagementHandler = async (event) => {
    console.log("Event:", JSON.stringify(event));
    const requestPath = event.rawPath;
    const httpMethod = event.requestContext.http.method;
    try {
        if (httpMethod === "OPTIONS") {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: "",
            };
        }
        if (requestPath === "/admin/users" && httpMethod === "GET") {
            console.log("Processing GET /admin/users request");
            try {
                const users = await keycloakApiService.getUsers();
                console.log("Fetched users from Keycloak:", users.length);
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(users),
                };
            }
            catch (error) {
                console.error("Error fetching users from Keycloak:", error);
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        message: "Failed to fetch users from Keycloak",
                        error: error instanceof Error ? error.message : JSON.stringify(error),
                    }),
                };
            }
        }
        if (requestPath.match(/^\/admin\/users\/[^/]+\/vacation$/) &&
            httpMethod === "PUT") {
            const userId = requestPath.split("/")[3];
            console.log("Processing PUT for user:", userId);
            try {
                const requestBody = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
                console.log("Parsed body:", requestBody);
                const { vacationDays } = requestBody;
                if (!vacationDays) {
                    return {
                        statusCode: 400,
                        headers: corsHeaders,
                        body: JSON.stringify({ message: "Vacation days are required" }),
                    };
                }
                const userAttributes = await keycloakApiService.getUserAttributes(userId);
                console.log("Fetched existing user attributes:", userAttributes);
                const updatedAttributes = {
                    ...userAttributes,
                };
                Object.entries(vacationDays).forEach(([year, data]) => {
                    const yearInt = Number.parseInt(year, 10);
                    if (!Number.isNaN(yearInt) && yearInt <= new Date().getFullYear()) {
                        if (data?.total != null) {
                            updatedAttributes[`vacation_${year}`] = [String(data.total)];
                        }
                        if (data?.remaining != null) {
                            updatedAttributes[`vacation_${year}_remaining`] = [
                                String(data.remaining),
                            ];
                        }
                    }
                });
                console.log("Attributes being updated:", JSON.stringify(updatedAttributes));
                await keycloakApiService.updateUserAttributes(userId, updatedAttributes);
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        id: userId,
                        updatedFields: Object.keys(updatedAttributes),
                    }),
                };
            }
            catch (error) {
                console.error("Error updating vacation data:", error);
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        message: "Failed to update vacation days",
                        error: error instanceof Error ? error.message : JSON.stringify(error),
                    }),
                };
            }
        }
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Route not found" }),
        };
    }
    catch (error) {
        console.error("Error handling request:", error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: "Error processing request",
                error: error instanceof Error ? error.message : JSON.stringify(error),
            }),
        };
    }
};
export const main = middyfy(vacationManagementHandler);
//# sourceMappingURL=handler.js.map