import { DynamoDB } from "aws-sdk"
import { UpdatePaidRequestBody } from "../../../types/on-call"
import { middyfy } from "@libs/lambda";
import { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";

/**
 * Lambda method for updating paid data
 * 
 * @param event event
 */
export const updatePaidHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const { year, week, paid } = event.body as UpdatePaidRequestBody;

  if (!year || year < 2020 || year > new Date().getFullYear()) {
    throw new Error("Invalid year");
  }

  if (!week || week < 1 || week > 53) {
    throw new Error("Invalid week");
  }

  if (paid === undefined) {
    throw new Error("Invalid paid status");
  }

  const dynamoDb = new DynamoDB.DocumentClient();

  await dynamoDb.update({
    TableName: "OnCallSchedule",
    Key: {
      Year: year,
      Week: week
    },
    UpdateExpression: "set Paid = :paid",
    ExpressionAttributeValues: {
      ":paid": paid
    }
  }).promise();

  return {
    statusCode: 200,
    body: "Paid status updated"
  };
};

export const main = middyfy(updatePaidHandler);