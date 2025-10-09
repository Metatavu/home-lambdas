import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import type { FromSchema } from "json-schema-to-ts";
import type QuestionnaireModel from "src/database/models/questionnaire";
import { questionnaireService } from "src/database/services";
import type questionnaireSchema from "src/schema/questionnaire";

/**
 * Added alias for schema
 */
type QuestionnaireBody = FromSchema<typeof questionnaireSchema>;

/**
 * Lambda function to update a questionnaire
 * QuestionnaireBody computed once, prevents possible infinite recurse
 * @param event event
 */
const updateQuestionnaireHandler: ValidatedEventAPIGatewayProxyEvent<QuestionnaireBody> = async (
  event
) => {
  const { pathParameters, body } = event;
  const id = pathParameters?.id;
  const { title, description, questions, tags, passedUsers, passScore } = body;

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

  const questionnaireUpdates: QuestionnaireModel = {
    id: existingQuestionnaire.id,
    title,
    description,
    questions,
    tags,
    passedUsers,
    passScore
  };

  try {
    const updatedQuestionnaire =
      await questionnaireService.updateQuestionnaire(questionnaireUpdates);

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
