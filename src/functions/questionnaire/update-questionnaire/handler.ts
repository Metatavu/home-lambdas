import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { questionnaireService } from "src/database/services";
import questionnaireSchema from "src/schema/questionnaire";
import type QuestionnaireModel from "src/database/models/questionnaire";
import { Questionnaire } from "src/generated/homeLambdasModels/model/questionnaire";

/**
 * Lambda function to update a questionnaire
 *
 * @param event event
 */
const updateQuestionnaireHandler: ValidatedEventAPIGatewayProxyEvent<typeof questionnaireSchema> = async event => {
  const { pathParameters, body } = event;
  const id = pathParameters?.id;
  const {
    title,
    description,
    questions,
    tags,
    passedUsers,
    passScore,
  } = body;

  if (!id) {
    return {
      statusCode: 400,
      body: "Bad request, missing id"
    };
  }

  const existingQuestionnaire = await questionnaireService.findQuestionnaire(id);
  if (!existingQuestionnaire) {
    return {
      statusCode: 404,
      body: `Questionnaire ${id} not found`
    };
  }

  const questionnaireUpdates: Questionnaire = {
    id: existingQuestionnaire.id,
    title,
    description,
    questions,
    tags,
    passedUsers,
    passScore,
  };

  try {
    // NOTE: Type mismatch in passedUsers field (number[] vs string[]). For now, just cast via unknown as per spec.
    const updatedQuestionnaire = await questionnaireService.updateQuestionnaire(
      questionnaireUpdates as unknown as QuestionnaireModel
    ) as unknown as Questionnaire;

    return {
      statusCode: 200,
      body: JSON.stringify(updatedQuestionnaire)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Error updating questionnaire record with id ${id}, ${error}`
    };
  }
};

export const main = middyfy(updateQuestionnaireHandler);