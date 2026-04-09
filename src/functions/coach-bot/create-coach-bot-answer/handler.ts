import type { CoachAnswer } from "src/generated/homeLambdasModels/model/coachAnswer";
import type { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import { DuplicateAnswerError, processCoachBotAnswer } from "src/libs/coach-bot-utils/streak-utils";
import { middyfy } from "src/libs/lambda";

/**
 * Handler for logging a coach bot answer and updating streak
 */
const createCoachBotAnswerHandler: ValidatedEventAPIGatewayProxyEvent<CoachAnswer> = async (
  event
) => {
  let body: CoachAnswer;
  if (typeof event.body === "string") {
    body = JSON.parse(event.body);
  } else {
    body = event.body as CoachAnswer;
  }
  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Request body is required." })
    };
  }

  const newAnswer = {
    slackUserId: body.slackUserId,
    answeredCorrectly: body.answeredCorrectly,
    role: body.role,
    topic: body.topic,
    topicKey: body.topicKey,
    difficulty: body.difficulty,
    date: body.date
  };
  try {
    const result = await processCoachBotAnswer(newAnswer);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    if (error instanceof DuplicateAnswerError) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: error.message
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Internal server error`
      })
    };
  }
};

export const main = middyfy(createCoachBotAnswerHandler);
