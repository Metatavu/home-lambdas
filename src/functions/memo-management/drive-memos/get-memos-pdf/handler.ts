import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DateTime } from "luxon";
import { getFilesInYear } from "src/services/google-drive-api-service";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda for retriving list of memos PDF
 *
 * @param event event
 */
const listMemoPdfHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const {queryStringParameters} = event;

  if (!queryStringParameters?.date) {
    return  {
      statusCode: 400,
      body: "Missing parameters"
    };
  }
  try {
    const date = DateTime.fromISO(queryStringParameters.date);
    const memosFiles = await getFilesInYear(date.year.toString());
    return {
      statusCode: 200,
      body: JSON.stringify(memosFiles)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to retrieve PDF content", details: error.message }),
    };
  }
};

export const main = middyfy(listMemoPdfHandler);