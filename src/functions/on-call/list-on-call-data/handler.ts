import { DynamoDB } from "aws-sdk"
import { middyfy } from "@libs/lambda";
import { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import { OnCallEntry } from "src/database/models/oncall";

/**
 * Lambda method for loading on-call data
 *
 * @param event event
 */
export const onCallListDataHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event: { queryStringParameters: { [key: string]: string } }) => {
  const { queryStringParameters } = event;

  if (!queryStringParameters || !queryStringParameters.year) {
    return {
      statusCode: 400,
      body: "Missing parameters"
    }
  }

  const year = parseInt(queryStringParameters.year)
  if (!year || year < 2020 || year > new Date().getFullYear()) {
    return {
      statusCode: 400,
      body: "Invalid year"
    }
  }

  const dynamoDb = new DynamoDB.DocumentClient();

  // Get data for the specified year
  const dataResult = await dynamoDb.query({
    TableName: "OnCallSchedule",
    KeyConditionExpression: "#yr = :year",
    ExpressionAttributeNames: {
      "#yr": "Year"
    },
    ExpressionAttributeValues: {
      ":year": year
    }
  }).promise();

  const data = (dataResult.Items as OnCallEntry[]) || [];

  if (!data.length) {
    return {
      statusCode: 204,
      body: "No content"
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data.map((entry) => ({
      ...entry,
      Person: entry.Username,
      Paid: entry.Paid || false
    })))
  };
}

export const main = middyfy(onCallListDataHandler);