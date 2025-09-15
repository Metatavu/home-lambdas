import type { APIGatewayProxyHandler } from "aws-lambda";
//import type QuestionnaireModel from "src/database/models/questionnaire";
import { questionnaireService } from "src/database/services";
import { middyfy } from "src/libs/lambda";
import { Questionnaire } from "src/generated/homeLambdasModels/model/questionnaire";

/**
 * Labmda for listing all questions from DynamoDB.
 */
const listQuestionnaireHandler: APIGatewayProxyHandler = async () => {
  try {
    const allQuestionnaires = await questionnaireService.listQuestionnaires();

    // Cast each item to Questionnaire to match the OpenAPI spec
    const questionnaireList: Questionnaire[] = allQuestionnaires.map(questionnaire => questionnaire as unknown as Questionnaire);

    return {
      statusCode: 200,
      body: JSON.stringify(questionnaireList),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to retrieve questionnaires.",
        details: error.message,
      }),
    };
  }
};

export const main = middyfy(listQuestionnaireHandler);
