import type { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
import { middyfy } from "src/libs/lambda";
import { markUserAsOnVacation } from "src/notifications/vacation-slack-utils";

export const setVacationHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const body = event.body ? JSON.parse(event.body) : null;
    const email = body?.email?.trim().toLowerCase();
    const endDate = body?.endDate; // "YYYY-MM-DD"

    if (!email || !endDate) {
      return { statusCode: 400, body: JSON.stringify({ message: "email and endDate required" }) };
    }

    await markUserAsOnVacation(email, endDate);

    return { statusCode: 200, body: JSON.stringify({ message: "Vacation status set" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};

export const main = middyfy(setVacationHandler);