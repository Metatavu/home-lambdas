import { APIGatewayProxyEvent } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';

interface DecodedToken {
  sub: string;
  realm_access?: {
    roles: string[];
  };
}

/**
 * Helper function to get the user's sub (user ID) from the Authorization header.
 * @param event - The API Gateway event containing the headers.
 * @returns The sub claim (user ID).
 */
export const getAuthDataFromToken = (event: { headers: APIGatewayProxyEvent['headers'] }): DecodedToken | null => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    
    if (!authHeader) {
      console.error("Missing Authorization header.");
      return null;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.error("Authorization header does not contain a valid token.");
      return null;
    }

    const decodedToken = jwt.decode(token) as DecodedToken;

    if (!decodedToken || typeof decodedToken === 'string') {
      console.error("Invalid token format or content.");
      return null;
    }

    if (!decodedToken.sub) {
      console.error("Token is missing 'sub' claim.");
      return null;
    }

    return {
      sub: decodedToken.sub,
      realm_access: decodedToken.realm_access
    };
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};
/**
 * Helper function to check if the user has the "admin" role.
 * 
 * @param event - The API Gateway event containing the headers.
 * @returns True if the user has the "admin" role, false otherwise.
 */
export const isAdminUser = (
  event: { headers: APIGatewayProxyEvent['headers'] }
): boolean => {
  const decoded = getAuthDataFromToken(event);
  if (!decoded) {
    return false;
  }
  const roles = decoded.realm_access?.roles || [];
  return roles.includes("admin");
};

