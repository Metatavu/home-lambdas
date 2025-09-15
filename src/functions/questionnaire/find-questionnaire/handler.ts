import { middyfy } from "src/libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { questionnaireService } from "src/database/services";
import { Questionnaire } from "src/generated/homeLambdasModels/model/questionnaire";

/**
 * Lambda for finding quiz entry from DynamoDB.
 *
 * @param event event
 * @returns quiz information as object
 */

const findQuestionnaireHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { id } = event.pathParameters || {};

  try {
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing or invalid path parameter: id",
        }),
      };
    }
    // NOTE: Type mismatch in passedUsers field (number[] vs string[]). 
    // For now, we just cast the result to Questionnaire as per spec.
    const quizById = await questionnaireService.findQuestionnaire(id) as unknown as Questionnaire;
    if (!quizById) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: "Quiz not found",
        }),
      };
    };

    return {
      statusCode: 200,
      body: JSON.stringify(quizById),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to retrieve quiz.",
        details: error.message,
      }),
    };
  }
};

export const main = middyfy(findQuestionnaireHandler);
