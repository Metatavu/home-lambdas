import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import SoftwareService from "src/database/services/software-service";
import { middyfy } from "src/libs/lambda";
import * as jwt from 'jsonwebtoken';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const softwareService = new SoftwareService(docClient);

/**
 * Handler for deleting a software entry in DynamoDB.
 * 
 * @returns Response object with status code and body.
 */
export const deleteSoftwareHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  console.log('Received event:', JSON.stringify(event));

  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader) {
    console.error("Missing Authorization header.");
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized. Authorization header is missing.' }),
    };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.error("Missing token in Authorization header.");
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized. Token is missing.' }),
    };
  }

  const decodedToken = jwt.decode(token) as { realm_access?: { roles: string[] } } | null;
  if (!decodedToken) {
    console.error("Invalid token or unable to decode.");
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized. Invalid token.' }),
    };
  }

  console.log('Decoded JWT Token:', JSON.stringify(decodedToken, null, 2));

  const realmRoles = decodedToken.realm_access?.roles || [];
  if (realmRoles.length === 0) {
    console.log('No roles found in realm_access.');
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden. No roles found.' }),
    };
  }

  console.log('User roles:', realmRoles);

  const isAdmin = realmRoles.includes('admin');
  console.log(isAdmin);
  if (!isAdmin) {
    console.log('User does not have admin privileges. Permission denied.');
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden. Admin privileges required.' }),
    };
  }

  const { id } = event.pathParameters || {};
  console.log('Path parameter (id):', id);

  if (!id) {
    console.log('Missing ID in path parameters.');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Id is required.' }),
    };
  }

  try {
    console.log('Looking up existing software with id:', id);
    const existingSoftware = await softwareService.findSoftware(id);

    if (!existingSoftware) {
      console.log('Software not found.');
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Software not found.' }),
      };
    }

    console.log(`Deleting software with id: ${id}`);
    await softwareService.deleteSoftware(id);

    return {
      statusCode: 204,
      body: null,
    };
  } catch (error) {
    console.error(`Error deleting software with id: ${id}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete software.', details: error.message }),
    };
  }
};

export const main = middyfy(deleteSoftwareHandler);
