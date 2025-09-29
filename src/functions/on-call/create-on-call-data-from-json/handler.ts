import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { middyfy } from "@libs/lambda";
import type { OnCallImportEntry, OnCallImportError } from "src/database/models/oncall";
import { isAdminUser } from "src/libs/auth-utils";

/**
 * Lambda method for importing on-call data from JSON
 *
 * Expects body to be an array of objects with "Week" (number) and "Person" (string) properties
 * and a query parameter "year" (number)
 */
export const onCallImportFromJsonHandler = async (event) => {
  if (!isAdminUser(event)) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        code: 403,
        message: "Access denied. Admin privileges required.",
      }),
    };
  }
  const year = event.queryStringParameters?.year
    ? parseInt(event.queryStringParameters.year, 10)
    : undefined;
  if (!year || year < 2020 || year > new Date().getFullYear()) {
    return {
      statusCode: 400,
      body: "Invalid or missing year in query parameter",
    };
  }
  let data: OnCallImportEntry[];
  try {
    data = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (err) {
    return {
      statusCode: 400,
      body: "Invalid JSON in body",
      error: err.message,
    };
  }
  if (!Array.isArray(data)) {
    return {
      statusCode: 400,
      body: "Body must be an array",
    };
  }

  const dynamoClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(dynamoClient);

  let imported = 0;
  const errors: OnCallImportError[] = [];
  for (const entry of data) {
    if (
      typeof entry.Week !== "number" ||
      typeof entry.Person !== "string" ||
      entry.Week < 1 || 
      entry.Week > 52
    ) {
      errors.push({ entry, error: "Invalid entry" });
      continue;
    }
    try {
      await docClient.send(
        new PutCommand({
          TableName: "OnCallSchedule",
          Item: {
            Year: year,
            Week: entry.Week,
            Username: entry.Person,
            Paid: false,
          },
        }),
      );
      imported++;
    } catch (err) {
      errors.push({ entry, error: err });
    }
  }
  return {
    statusCode: errors.length ? 207 : 200,
    body: JSON.stringify({ imported, errors }),
  };
};

export const main = middyfy(onCallImportFromJsonHandler);
