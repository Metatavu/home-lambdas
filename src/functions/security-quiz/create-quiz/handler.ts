import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { middyfy } from "src/libs/lambda";
import { createQuizAttempt } from "src/libs/security-quiz-utils";
import { processQuizAttempt } from "src/libs/streak-utils";

/**
 * Handler for logging a quiz attempt and updating streak
 */
const createQuizAttemptHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const body = event.body ? JSON.parse(event.body) : null;
  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Request body is required." })
    };
  }

  const attempt = createQuizAttempt(body);

  try {
    const result = await processQuizAttempt(attempt);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Failed to process quiz attempt ${error}`
      })
    };
  }
};

export const main = middyfy(createQuizAttemptHandler);
