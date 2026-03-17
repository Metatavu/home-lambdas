import { questionnaireService } from "src/database/services";
import type { Questionnaire } from "src/generated/homeLambdasModels/model/questionnaire";
import type { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import { middyfy } from "src/libs/lambda";
import type questionnaireSchema from "src/schema/questionnaire";
import { v4 as uuidv4 } from "uuid";

/**
 * Handler for creating a new questionnaire entry in DynamoDB.
 *
 * @param event - API Gateway event containing the request body.
 * @returns Response object with status code
 */
export const createQuestionnaireHandler: ValidatedEventAPIGatewayProxyEvent<
  typeof questionnaireSchema
> = async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Request body is required." })
    };
  }

  const { title, description, questions, tags, passedUsers, passScore } = event.body;

  if (!title || !description || !questions || !passScore) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Some required data is missing !" })
    };
  }

  const newQuestionnaireId: string = uuidv4();
  let questionnaireResponse: Questionnaire | undefined;

  try {
    const questionsWithIds = questions.map((question) => ({
      id: uuidv4(),
      questionText: question.questionText,
      answerOptions: question.answerOptions.map((option) => ({
        id: uuidv4(),
        label: option.label,
        isCorrect: option.isCorrect
      }))
    }));

    const createdQuestionnaire = await questionnaireService.createQuestionnaire({
      id: newQuestionnaireId,
      title: title,
      description: description,
      questions: questionsWithIds,
      tags: tags,
      passedUsers: passedUsers,
      passScore: passScore
    });

    questionnaireResponse = createdQuestionnaire;

    return {
      statusCode: 201,
      body: JSON.stringify(questionnaireResponse)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Failed to create questionnaire entry ${error}`
    };
  }
};

export const main = middyfy(createQuestionnaireHandler);
