import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { createCoachBotAnswer } from "src/libs/coach-bot-utils/coach-answer-mapper";
import { DuplicateAnswerError, processCoachBotAnswer } from "src/libs/coach-bot-utils/streak-utils";
import { middyfy } from "src/libs/lambda";

/**
 * Handler for logging a coach bot answer and updating streak
 */
const createCoachBotAnswerHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const body = event.body;
    if (!body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request body is required." })
      };
    }

    const attempt = createCoachBotAnswer(body);

    const result = await processCoachBotAnswer(attempt);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    if (error instanceof DuplicateAnswerError) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          code: "ALREADY_ANSWERED",
          message: error.message
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Failed to process coach bot answer ${error}`
      })
    };
  }
};

export const main = middyfy(createCoachBotAnswerHandler);
