import { DynamoDB } from "aws-sdk"
import { middyfy } from "@libs/lambda";
import { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";

/**
 * Lambda method for loading on-call data
 *
 * @param event event
 */
export const listOnCallDataHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event: { queryStringParameters: { [key: string]: string } }) => {
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

  // Получаем все записи за указанный год
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

  const data = dataResult.Items || [];

  // Загружаем nameMap из отдельной таблицы
  const nameMapResult = await dynamoDb.scan({
    TableName: "OnCallNameMap"
  }).promise();

  const nameMap: { [key: string]: string } = {};
  (nameMapResult.Items || []).forEach(item => {
    nameMap[item.Username] = item.FullName;
  });

  if (!data.length) {
    return {
      statusCode: 204,
      body: "No content"
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data.map((entry: any) => ({
      ...entry,
      Person: nameMap[entry.Person] || entry.Person,
      Paid: entry.Paid || false
    })))
  };
}

export const main = middyfy(listOnCallDataHandler);