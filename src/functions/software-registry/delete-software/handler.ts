import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import SoftwareService from "src/database/services/software-service";
import { isAdminUser } from "src/libs/auth-utils";
import { middyfy } from "src/libs/lambda";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const softwareService = new SoftwareService(docClient);

/**
 * Handler for deleting a software entry in DynamoDB.
 *
 * @returns Response object with status code and body.
 */
export const deleteSoftwareHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  console.log("Received event:", JSON.stringify(event));
  if (!isAdminUser(event)) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        code: 403,
        message: "Access denied. Admin privileges required."
      })
    };
  }
  const { id } = event.pathParameters || {};
  console.log("Path parameter (id):", id);

  if (!id) {
    console.log("Missing ID in path parameters.");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Id is required." })
    };
  }

  try {
    console.log("Looking up existing software with id:", id);
    const existingSoftware = await softwareService.findSoftware(id);

    if (!existingSoftware) {
      console.log("Software not found.");
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Software not found." })
      };
    }

    console.log(`Deleting software with id: ${id}`);
    await softwareService.deleteSoftware(id);

    return {
      statusCode: 204,
      body: null
    };
  } catch (error) {
    console.error(`Error deleting software with id: ${id}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to delete software.", details: error.message })
    };
  }
};

export const main = middyfy(deleteSoftwareHandler);
