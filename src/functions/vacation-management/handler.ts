import { middyfy } from "src/libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { CustomKeycloakProfile } from "src/database/services/keycloak-api-service";
import dotenv from "dotenv";

dotenv.config();

const keycloakApiService = CreateKeycloakApiService();

/**
 * Lambda for managing user vacation days in Keycloak
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
const vacationManagementHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  console.log('Event:', JSON.stringify(event));
  
  // Access both path properties to handle different API Gateway formats
  const requestPath = (event as any).rawPath || event.path;
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;

  try {
    // GET /admin/users - Get all users from Keycloak
    if (requestPath === '/admin/users' && httpMethod === 'GET') {
      console.log('Processing GET /admin/users request');

      try {
        const users: CustomKeycloakProfile[] = await keycloakApiService.getUsers();
        console.log('Fetched users from Keycloak:', users.length);

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
          },
          body: JSON.stringify(users)
        };
      } catch (error) {
        console.error('Error fetching users from Keycloak:', error);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
          },
          body: JSON.stringify({ message: 'Failed to fetch users from Keycloak' })
        };
      }
    }

    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      body: JSON.stringify({ message: 'Route not found' })
    };
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      body: JSON.stringify({ message: 'Error processing request', error: error.message })
    };
  }
};

export const main = middyfy(vacationManagementHandler);
