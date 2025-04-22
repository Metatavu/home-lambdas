import { middyfy } from "src/libs/lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

const keycloakApiService = CreateKeycloakApiService();

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

const getkeyuserhandler: APIGatewayProxyHandlerV2 = async (event) => {
  const userId = event.pathParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "User ID is required" }),
    };
  }

  try {
    const user = await keycloakApiService.findUser(userId);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(user),
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Failed to fetch user" }),
    };
  }
};

export const main = middyfy(getkeyuserhandler);
