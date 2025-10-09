import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { questionnaireService } from "src/database/services";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda for deleting a questionnaire entry from DynamoDB.
 *
 * @param event event
 */
const deleteQuestionnaireHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { id } = event.pathParameters || {};

  try {
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing or invalid path parameter: id"
        })
      };
    }

    const findQuestionnaireById = await questionnaireService.findQuestionnaire(id);
    if (!findQuestionnaireById) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Questionnaire ${id} not found.`
        })
      };
    }

    await questionnaireService.deleteQuestionnaire(id);

    return {
      statusCode: 204,
      body: JSON.stringify("")
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to delete questionnaire.",
        details: error.message
      })
    };
  }
};

export const main = middyfy(deleteQuestionnaireHandler);
