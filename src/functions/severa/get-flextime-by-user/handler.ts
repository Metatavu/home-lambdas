import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateSeveraApiService } from "src/database/services/severa-api-service";
import { middyfy } from "src/libs/lambda";

/**
 * Handler for getting flextime by user from Severa REST API.
 * 
 * @param event - API Gateway event containing the user GUID.
 */
export const getFlextimeHandler: APIGatewayProxyHandler = async (event) => {
  const { pathParameters } = event

  try {
    
    const api = CreateSeveraApiService();

    if (!pathParameters || !pathParameters.severaGuid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "User Guid is required" }),
      };
    }

    const flexTimeBySeveraGuid = await api.getFlextimeBySeveraGuid(pathParameters.severaGuid);

    return {
      statusCode: 200,
      body: JSON.stringify(flexTimeBySeveraGuid),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

export const main = middyfy(getFlextimeHandler);