import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { UpdatePaidRequestBody } from "../../../types/on-call"
import { middyfy } from "@libs/lambda";
import { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";

/**
 * Lambda method for updating paid data
 * 
 * @param event event
 */
export const onCallUpdatePaidHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
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

  const dynamoClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(dynamoClient);

  const params = {
    TableName: "OnCallSchedule",
    Key: {
      Year: year,
      Week: week
    },
    UpdateExpression: "set Paid = :paid",
    ExpressionAttributeValues: {
      ":paid": paid
    }
  };
  await docClient.send(new UpdateCommand(params));

  return {
    statusCode: 200,
    body: "Paid status updated"
  };
};

export const main = middyfy(onCallUpdatePaidHandler);