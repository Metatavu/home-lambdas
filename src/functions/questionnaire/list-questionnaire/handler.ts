import type { APIGatewayProxyHandler } from "aws-lambda";
import { questionnaireService } from "src/database/services";
import type { Questionnaire } from "src/generated/homeLambdasModels/model/questionnaire";
import { middyfy } from "src/libs/lambda";

/**
 * Labmda for listing all questions from DynamoDB.
 */
const listQuestionnaireHandler: APIGatewayProxyHandler = async () => {
  try {
    const allQuestionnaires = await questionnaireService.listQuestionnaires();

    const questionnaireList: Questionnaire[] = allQuestionnaires.map(
      (questionnaire) => questionnaire as Questionnaire
    );

    return {
      statusCode: 200,
      body: JSON.stringify(questionnaireList)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to retrieve questionnaires.",
        details: error.message
      })
    };
  }
};

export const main = middyfy(listQuestionnaireHandler);
