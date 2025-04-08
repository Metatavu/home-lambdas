import { middyfy } from "src/libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { CustomKeycloakProfile } from "src/database/services/keycloak-api-service";
import dotenv from "dotenv";

dotenv.config();

const keycloakApiService = CreateKeycloakApiService();

// Common headers for CORS
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
};

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
    // OPTIONS request for CORS preflight
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    // GET /users - Get all users from Keycloak
    if (requestPath === '/users' && httpMethod === 'GET') {
      console.log('Processing GET /users request');

      try {
        const users: CustomKeycloakProfile[] = await keycloakApiService.getUsers();
        console.log('Fetched users from Keycloak:', users.length);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(users)
        };
      } catch (error) {
        console.error('Error fetching users from Keycloak:', error);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Failed to fetch users from Keycloak' })
        };
      }
    }

    // PUT /users/:id/attributes - Update user attributes
if (requestPath.match(/^\/users\/[^/]+\/attributes$/) && httpMethod === 'PUT') {
  const userId = requestPath.split('/')[2]; // Extract user ID from path
  console.log('Processing PUT /users/:id/attributes request for user ID:', userId);
  
  try {
    const requestBody = JSON.parse(event.body || '{}');
    const { attributes } = requestBody;
    
    if (!attributes) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Attributes are required' })
      };
    }
// POST /users/:id/vacation-days - Update user vacation days
if (requestPath.match(/^\/users\/[^/]+\/vacation-days$/) && httpMethod === 'POST') {
  const userId = requestPath.split('/')[2]; // Extract user ID from path
  console.log('Processing POST /users/:id/vacation-days request for user ID:', userId);
  
  try {
    const requestBody = JSON.parse(event.body || '{}');
    const { vacationDays } = requestBody;
    
    if (!vacationDays) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Vacation days are required' })
      };
    }
    
    // Build attributes to update from vacation days
    const attributes: Record<string, string[]> = {};
    
    Object.keys(vacationDays).forEach(year => {
      attributes[`vacation_${year}`] = [vacationDays[year].total];
      attributes[`vacation_${year}_remaining`] = [vacationDays[year].remaining];
    });
    
    // Update the user attributes
    await keycloakApiService.updateUserAttributes(userId, attributes);
    
    // Return success response
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        id: userId,
        updatedFields: Object.keys(attributes)
      })
    };
  } catch (error) {
    console.error('Error updating vacation days:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Failed to update vacation days',
        error: error.message
      })
    };
  }
}
    // Call the service with the updated method name
    await keycloakApiService.updateUserAttributes(userId, attributes);
    
    // Return the updated fields in the response
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        id: userId,
        updatedFields: Object.keys(attributes)
      })
    };
  } catch (error) {
    console.error('Error updating user attributes:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Failed to update user attributes',
        error: error.message
      })
    };
  }
}

    // Default route not found response
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Route not found' })
    };
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Error processing request', 
        error: error.message 
      })
    };
  }
};

export const main = middyfy(vacationManagementHandler);