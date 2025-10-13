import { APIGatewayProxyHandler } from "aws-lambda";
import { middyfy } from "src/libs/lambda";
import {softwareService} from "src/database/services";

/**
 * Handler for listing all software entries from DynamoDB.
 * 
 * @returns Response object with status code and body.
 */
export const listSoftwareHandler: APIGatewayProxyHandler = async () => {
  console.log('Received request to list software entries');

  try {
    console.log('Fetching software list from DynamoDB');
    const softwareList = await softwareService.listSoftware();

    console.log('Software list retrieved successfully:', softwareList);
    return {
      statusCode: 200,
      body: JSON.stringify(softwareList),
    };
  } catch (error) {
    console.error("Error retrieving software list from DynamoDB:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve software list.', details: error.message }),
    };
  }
};

export const main = middyfy(listSoftwareHandler);
