import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { isAdminUser } from "src/libs/auth-utils";
import { middyfy } from "src/libs/lambda";
import {softwareService} from "src/database/services";

/**
 * Handler for deleting a software entry in DynamoDB.
 *
 * @returns Response object with status code and body.
 */
export const deleteSoftwareHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
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

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Id is required." })
    };
  }

  try {
    const existingSoftware = await softwareService.findSoftware(id);

    if (!existingSoftware) {
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
