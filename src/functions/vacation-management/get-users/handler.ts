import { middyfy } from "src/libs/lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

const keycloakApiService = CreateKeycloakApiService();

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

const getkeyusershandler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const users = await keycloakApiService.getUsers();
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(users),
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Failed to fetch users" }),
    };
  }
};

export const main = middyfy(getkeyusershandler);
