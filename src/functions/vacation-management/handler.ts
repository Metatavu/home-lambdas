import { middyfy } from "src/libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import axios from 'axios';
import dotenv from "dotenv";
dotenv.config();
// Types
interface KeycloakToken {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  attributes?: {
    [key: string]: string[];
  };
}

interface UpdateVacationRequest {
  attributes: {
    [key: string]: string;
  };
}

// Environment variables (set in our Lambda configuration)
const KEYCLOAK_URL = process.env.IS_OFFLINE === 'true' ? 'http://localhost:3000' : (process.env.VITE_KEYCLOAK_URL || process.env.KEYCLOAK_URL);

const KEYCLOAK_REALM = process.env.VITE_KEYCLOAK_REALM || process.env.KEYCLOAK_REALM;
const KEYCLOAK_CLIENT_ID = process.env.VITE_KEYCLOAK_CLIENT_ID || process.env.KEYCLOAK_CLIENT_ID;
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;
// Mock user data for development
const mockUsers = [
  {
    id: "user1",
    username: "john.doe",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    enabled: true,
    attributes: {
      "vacation_2024": ["20"],
      "vacation_2024_remaining": ["15"]
    }
  },
  {
    id: "user2",
    username: "jane.smith",
    firstName: "Jane", 
    lastName: "Smith",
    email: "jane.smith@example.com",
    enabled: true,
    attributes: {
      "vacation_2024": ["25"],
      "vacation_2024_remaining": ["10"]
    }
  },
  {
    id: "user3",
    username: "steve",
    firstName: "Steve", 
    lastName: "Smith",
    email: "steve.smith@example.com",
    enabled: true,
    attributes: {
      "vacation_2024": ["20"],
      "vacation_2024_remaining": ["10"]
    }
  }
];

/**
 * Check if Keycloak is configured and we're not in offline mode
 */
const isKeycloakConfigured = (): boolean => {
  // Always return false when running offline
  if (process.env.IS_OFFLINE === 'true') {
    console.log('Running in offline mode, Keycloak will not be used');
    return false;
  }
  
  return !!(KEYCLOAK_URL && KEYCLOAK_REALM && KEYCLOAK_CLIENT_ID && KEYCLOAK_CLIENT_SECRET);
}

/**
 * Get Keycloak admin access token
 * Uses client credentials flow for admin access, with fallbacks
 */
const getKeycloakToken = async (): Promise<string | null> => {
  try {
    // Skip authentication for local development
    if (process.env.IS_OFFLINE === 'true') {
      console.log('Running offline - using mock data');
      return null;
    }
    
    console.log('Getting Keycloak token...');
    console.log('KEYCLOAK_URL:', KEYCLOAK_URL);
    console.log('KEYCLOAK_REALM:', KEYCLOAK_REALM);
    console.log('KEYCLOAK_CLIENT_ID:', KEYCLOAK_CLIENT_ID ? 'Provided' : 'Missing');
    console.log('KEYCLOAK_CLIENT_SECRET:', KEYCLOAK_CLIENT_SECRET ? 'Provided' : 'Missing');
    
    // Check if Keycloak is configured
    if (!isKeycloakConfigured()) {
      console.log('Keycloak is not configured, will use mock data');
      return null;
    }

    // Method 1: Try client credentials with timebank-api first
    try {
      console.log('Attempting client credentials authentication with timebank-api...');
      const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
      console.log('Token URL:', tokenUrl);
      
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', 'timebank-api');
      params.append('client_secret', KEYCLOAK_CLIENT_SECRET || '');

      const response = await axios.post<KeycloakToken>(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('Token received successfully via client credentials');
      return response.data.access_token;
    } catch (clientError) {
      console.error('Client credentials authentication failed:', clientError.response?.data || clientError.message);
    }
    
    // Method 2: Fall back to admin authentication if client credentials failed
    try {
      console.log('Falling back to admin authentication...');
      
      // Use the master realm for admin authentication
      const adminTokenUrl = `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`;
      console.log('Admin token URL:', adminTokenUrl);
      
      const adminParams = new URLSearchParams();
      adminParams.append('grant_type', 'password');
      adminParams.append('client_id', 'admin-cli'); // Built-in admin client
      adminParams.append('username', process.env.KEYCLOAK_ADMIN_USERNAME || 'service-account-timebank-api');
      adminParams.append('password', process.env.KEYCLOAK_ADMIN_PASSWORD || 'sJxCd5JSqtaVl3iFrNU0WqCW1IXDC5FV');
      
      const adminResponse = await axios.post<KeycloakToken>(adminTokenUrl, adminParams, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log('Token received successfully via admin authentication');
      return adminResponse.data.access_token;
    } catch (adminError) {
      console.error('Admin authentication also failed:', adminError.response?.data || adminError.message);
    }
    
    // If we get here, all authentication methods failed
    console.log('All authentication methods failed, using mock data');
    return null;
  } catch (error) {
    console.error('Error getting Keycloak token:', error);
    return null; // Return null instead of throwing
  }
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
  
  // Get HTTP method from event (handle different API Gateway versions)
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  
  console.log('Request path:', requestPath);
  console.log('HTTP method:', httpMethod);
  
  // Handle CORS preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: ''
    };
  }
  
  try {
    // GET /admin/users - Get all users with vacation attributes
    if (requestPath === '/admin/users' && httpMethod === 'GET') {
      console.log('Processing GET /admin/users request');
      
      try {
        const token = await getKeycloakToken();
        console.log('Token received:', token ? 'Yes' : 'No');
        
        // For local testing, if Keycloak isn't available or token couldn't be obtained
        if (!token) {
          console.log('Using mock data for testing');
          
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify(mockUsers)
          };
        }
        
        const usersUrl = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?max=1000`;
        console.log('Fetching users from:', usersUrl);
        
        const response = await axios.get<User[]>(usersUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const users = response.data;
        console.log('Retrieved users count:', users.length);
        
        // For each user, fetch their attributes to include vacation information
        const usersWithAttributes = await Promise.all(users.map(async (user) => {
          const userDetailsUrl = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${user.id}`;
          const userResponse = await axios.get<User>(userDetailsUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          return userResponse.data;
        }));
        
        console.log('Users with attributes count:', usersWithAttributes.length);
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
          },
          body: JSON.stringify(usersWithAttributes)
        };
      } catch (error) {
        console.error('Error in GET /admin/users:', error);
        
        // Fall back to mock data on error
        console.log('Falling back to mock data due to error');
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
          },
          body: JSON.stringify(mockUsers)
        };
      }
    }
    
    // PUT /admin/users/{userId}/vacation - Update user vacation attributes
    if (requestPath && requestPath.match(/\/admin\/users\/[^\/]+\/vacation$/) && httpMethod === 'PUT') {
      console.log('Processing PUT request for vacation update');
      const userId = event.pathParameters?.userId;
      
      if (!userId) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
          },
          body: JSON.stringify({ message: 'User ID is required' })
        };
      }
      
      console.log('Updating vacation days for user:', userId);
      const { attributes } = (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) as UpdateVacationRequest;
      console.log('Update attributes:', attributes);
      
      // For local testing or if Keycloak isn't available
      if (!isKeycloakConfigured()) {
        console.log('Using mock update for testing');
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
          },
          body: JSON.stringify({ 
            message: 'User vacation days updated successfully (mock)',
            userId,
            attributes
          })
        };
      }
      
      // Get Keycloak token
      const token = await getKeycloakToken();
      
      if (!token) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
          },
          body: JSON.stringify({ 
            message: 'User vacation days updated successfully (mock)',
            userId,
            attributes
          })
        };
      }
      
      // Get current user data
      const userUrl = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}`;
      const userResponse = await axios.get<User>(userUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const userData = userResponse.data;
      
      // Convert single string values to arrays for Keycloak
      const formattedAttributes: { [key: string]: string[] } = {};
      
      Object.entries(attributes).forEach(([key, value]) => {
        formattedAttributes[key] = [value.toString()];
      });
      
      // Update user attributes
      const updatedAttributes = {
        ...(userData.attributes || {}),
        ...formattedAttributes
      };
      
      // Update user in Keycloak
      await axios.put(userUrl, {
        ...userData,
        attributes: updatedAttributes
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization'
        },
        body: JSON.stringify({ message: 'User vacation days updated successfully' })
      };
    }
    
    // Route not found
    console.log('Route not found:', requestPath);
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      body: JSON.stringify({ 
        message: 'Route not found',
        path: requestPath,
        method: httpMethod
      })
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
      body: JSON.stringify({ 
        message: 'Error processing request', 
        error: error.message 
      })
    };
  }
};

export const main = middyfy(vacationManagementHandler);