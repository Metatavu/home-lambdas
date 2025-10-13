import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { middyfy } from "@libs/lambda";
import { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import { OnCall } from "src/generated/homeLambdasModels/model/onCall";

/**
 * Lambda method for loading on-call data
 *
 * @param event event
 */
export const onCallListDataHandler: ValidatedEventAPIGatewayProxyEvent<OnCall> = async (event: { queryStringParameters: { [key: string]: string } }) => {
  const { queryStringParameters } = event;

  if (!queryStringParameters || !queryStringParameters.year) {
    return {
      statusCode: 400,
      body: JSON.stringify({ code: 0, message: "Missing parameters" }),
      headers: {
        "Content-Type": "application/json"
      }
    }
  }

  const year = parseInt(queryStringParameters.year)
  if (!year || year < 2020 || year > new Date().getFullYear()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ code: 0, message: "Year parameter is invalid" }),
      headers: {
        "Content-Type": "application/json"
      }
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
  const data = (dataResult.Items as OnCall[]) || [];

  if (!data.length) {
    return {
      statusCode: 204,
      body: JSON.stringify({ message: "No content" }),
      headers: {
        "Content-Type": "application/json"
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data.map((entry) => ({
      ...entry,
      Username: entry.username,
      Paid: entry.paid || false
    })))
  };
}

export const main = middyfy(onCallListDataHandler);