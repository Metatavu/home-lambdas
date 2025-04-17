import { middyfy } from "src/libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { CustomKeycloakProfile } from "src/database/services/keycloak-api-service";
import dotenv from "dotenv";
dotenv.config();
const keycloakApiService = CreateKeycloakApiService();

/**
 * CORS headers for API responses
 */
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
};
/**
 * Updates or adds a year entry in an array of "YEAR:value" strings
 * 
 * @param array - Array of year entries in "YEAR:value" format
 * @param year - Year to update or add
 * @param value - Value to set for the specified year
 */
function updateYearEntry(array: string[], year: string, value: string): void {
  const yearPrefix = `${year}:`;
  const existingIndex = array.findIndex(entry => entry.startsWith(yearPrefix));
  
  if (existingIndex >= 0) {
    array[existingIndex] = `${yearPrefix}${value}`;
  } else {
    array.push(`${yearPrefix}${value}`);
  }
}

/**
 * Lambda handler for vacation management API endpoints
 * 
 * Supported endpoints:
 * - GET /admin/users - Retrieve all users
 * - GET /admin/users/:id - Get specific user
 * - PUT /admin/users/:id/vacation - Update user vacation days
 * - PUT /users/:id/attributes - Update user attributes
 * 
 * @param event - AWS API Gateway event
 * @returns API Gateway response with appropriate status code and body
 */
const vacationManagementHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const requestPath = (event as any).rawPath || event.path;
  const httpMethod = event.httpMethod || (event.requestContext as any)?.http?.method;

  try {
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }
    /**
     * GET /admin/users - Retrieve all users from Keycloak
     */
    if (requestPath === '/admin/users' && httpMethod === 'GET') {
      try {
        const users: CustomKeycloakProfile[] = await keycloakApiService.getUsers();
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(users)
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Failed to fetch users' })
        };
      }
    }

    /**
     * GET /admin/users/:id - Get specific user by ID
     */
    if (requestPath.match(/^\/admin\/users\/[^/]+$/) && httpMethod === 'GET') {
      const userId = requestPath.split('/')[3];

      try {
        const user = await keycloakApiService.findUser(userId);
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(user)
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Server error", error: error.message })
        };
      }
    }

    /**
     * PUT /admin/users/:id/vacation - Update user vacation data
     * 
     * Updates vacation day allocations and remaining days
     * Supports two storage formats:
     * 1. Individual attributes: vacation_YEAR and vacation_YEAR_remaining
     * 2. Arrays: vacationDaysByYear and unspentVacationDaysByYear in "YEAR:value" format
     */
    if (requestPath.match(/^\/admin\/users\/[^/]+\/vacation$/) && httpMethod === 'PUT') {
      const userId = requestPath.split('/')[3];

      try {
        // Parse request body safely
        let requestBody;
        if (typeof event.body === 'string') {
          requestBody = JSON.parse(event.body);
        } else {
          requestBody = event.body || {};
        }
        
        const { vacationDays, attributes: directAttributes } = requestBody;

        if (!vacationDays && !directAttributes) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Vacation days or attributes are required" }),
          };
        }
        const existingUser = await keycloakApiService.findUser(userId);
        const attributes: Record<string, string[]> = {
          ...(existingUser.attributes as Record<string, string[]>) || {}
        };

        if (directAttributes) {
          Object.assign(attributes, directAttributes);
        }

        if (vacationDays) {
          if (!attributes.vacationDaysByYear) attributes.vacationDaysByYear = [];
          if (!attributes.unspentVacationDaysByYear) attributes.unspentVacationDaysByYear = [];
          for (const year of Object.keys(vacationDays)) {
            attributes[`vacation_${year}`] = [String(vacationDays[year].total)];
            attributes[`vacation_${year}_remaining`] = [String(vacationDays[year].remaining)];
            
            const totalWithPadding = String(vacationDays[year].total).padStart(3, '0');
            const remainingWithPadding = String(vacationDays[year].remaining).padStart(3, '0');
            
            updateYearEntry(attributes.vacationDaysByYear, year, totalWithPadding);
            updateYearEntry(attributes.unspentVacationDaysByYear, year, remainingWithPadding);
          }
          
          if (!attributes.isActive) {
            attributes.isActive = ['Active'];
          }
        }
        await keycloakApiService.updateUserAttribute(userId, attributes);
        
        const updatedUser = await keycloakApiService.findUser(userId);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            id: userId,
            updatedFields: Object.keys(attributes),
            user: updatedUser
          }),
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Server error", error: error.message }),
        };
      }
    }

    /**
     * PUT /users/:id/attributes - Generic endpoint to update any user attributes
     * 
     * Allows direct manipulation of Keycloak user attributes
     */
    if (requestPath.match(/^\/users\/[^/]+\/attributes$/) && httpMethod === 'PUT') {
      const userId = requestPath.split('/')[2];
      try {
        let requestBody;
        if (typeof event.body === 'string') {
          requestBody = JSON.parse(event.body);
        } else {
          requestBody = event.body || {};
        }
        
        const { attributes } = requestBody;
        if (!attributes) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Attributes are required' })
          };
        }
        
        await keycloakApiService.updateUserAttribute(userId, attributes);
        const updatedUser = await keycloakApiService.findUser(userId);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            id: userId,
            updatedFields: Object.keys(attributes),
            user: updatedUser
          })
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Failed to update user attributes', error: error.message })
        };
      }
    }
    // If no route matches
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Route not found' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Error processing request', error: error.message })
    };
  }
};
export const main = middyfy(vacationManagementHandler);