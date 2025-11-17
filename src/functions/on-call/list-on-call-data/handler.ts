import { middyfy } from "@libs/lambda";
import { onCallScheduleService } from "src/database/services";
import type { OnCall } from "src/generated/homeLambdasModels/model/onCall";
import type { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";

/**
 * Lambda method for loading on-call data
 *
 * @param event event
 */
export const onCallListDataHandler: ValidatedEventAPIGatewayProxyEvent<OnCall> = async (event: {
  queryStringParameters: { [key: string]: string };
}) => {
  const { queryStringParameters } = event;

  if (!queryStringParameters || !queryStringParameters.year) {
    return {
      statusCode: 400,
      body: JSON.stringify({ code: 0, message: "Missing parameters" }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  const year = Number.parseInt(queryStringParameters.year, 10);
  if (!year || year < 2020 || year > new Date().getFullYear()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ code: 0, message: "Year parameter is invalid" }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  const data = await onCallScheduleService.listOnCallSchedulesByYear(year);

  if (!data.length) {
    return {
      statusCode: 204,
      body: JSON.stringify({ message: "No content" }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      data.map((entry) => ({
        ...entry,
        Username: entry.Username,
        Email: entry.Email || null,
        Paid: entry.Paid || false
      }))
    )
  };
};

export const main = middyfy(onCallListDataHandler);
