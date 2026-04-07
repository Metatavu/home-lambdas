import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { createCoachBotAnswer } from "src/libs/coach-bot-utils";
import { middyfy } from "src/libs/lambda";
import { processCoachBotAnswer } from "src/libs/streak-utils";

/**
 * Handler for logging a coach bot answer and updating streak
 */
const createCoachBotAnswerHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const body = event.body ? JSON.parse(event.body) : null;
  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Request body is required." })
    };
  }

  const attempt = createCoachBotAnswer(body);

  try {
    const result = await processCoachBotAnswer(attempt);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Failed to process coach bot answer ${error}`
      })
    };
  }
};

export const main = middyfy(createCoachBotAnswerHandler);
