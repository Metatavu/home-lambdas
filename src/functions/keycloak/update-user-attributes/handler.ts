import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";

/**
 * Lambda handler to update a user's attributes
 * 
 * @param event API Gateway event 
 * @returns Response message as JSON string
 */
const updateUserAttributeHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
  ) => { 
  try {
    if (!event.body) {
    throw new Error("Request body is missing.");
  }

  const body = JSON.parse(JSON.stringify(event.body));
  const { id, attributes } = body;
  const email = attributes?.email; 

  const allowedKeys = ["isSeveraOptIn"]

  if (!id || !attributes || typeof attributes !== "object") {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing or invalid parameters: 'id' or 'attribute'." }),
    };
  }

  const keys = Object.keys(attributes);
  if (!keys.every(key => allowedKeys.includes(key))) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Attributes contain invalid keys." }),
    };
  }

  const api = CreateKeycloakApiService();
  const severaApi = CreateSeveraApiService()

  let severaUser: {email:string, guid:string } | null = null

  if (process.env.NODE_ENV === "development") {
    severaUser = await severaApi.getTestUser();
  } else {
    severaUser = await severaApi.getUserByEmail(email, attributes);
  }
  if (!severaUser || !severaUser.email) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Severa user not found." }),
    };
  }

  if (!attributes.isActive) {
    attributes.isActive = ["Active"];
  }
  attributes["severa-user-id"] = [severaUser.guid];

  await api.updateUserAttribute(id, attributes);

  await severaApi.getUserByEmail(severaUser.email, attributes);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "IsSeveraOptin has already been updated in Severa, and severaId will be added to Keycloak." }),
  };
} catch (error) {
  return {
    statusCode: 500,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: error.message, stack: error.stack }),
  };
}
};

export const main = middyfy(updateUserAttributeHandler);
