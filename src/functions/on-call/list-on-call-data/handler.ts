import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
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

  const dynamoClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(dynamoClient);

  // Get data for the specified year
  const params = {
    TableName: "OnCallSchedule",
    KeyConditionExpression: "#yr = :year",
    ExpressionAttributeNames: {
      "#yr": "Year"
    },
    ExpressionAttributeValues: {
      ":year": year
    }
  };
  const dataResult = await docClient.send(new QueryCommand(params));
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
      Username: entry.Username,
      Paid: entry.Paid || false
    })))
  };
}

export const main = middyfy(onCallListDataHandler);