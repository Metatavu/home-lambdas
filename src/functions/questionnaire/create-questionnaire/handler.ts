import { middyfy } from "src/libs/lambda";
import { questionnaireService } from "src/database/services";
import { v4 as uuidv4 } from "uuid";
import type QuestionnaireModel from "src/database/models/questionnaire";
import type { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import type questionnaireSchema from "src/schema/questionnaire";

/**
 * Handler for creating a new questionnaire entry in DynamoDB.
 *
 * @param event - API Gateway event containing the request body.
 * @returns Response object with status code
 */
export const createQuestionnaireHandler: ValidatedEventAPIGatewayProxyEvent<typeof questionnaireSchema> = async (event) => {
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
  let questionnaireResponse: QuestionnaireModel | undefined = undefined;

  try {
    const createdQuestionnaire = await questionnaireService.createQuestionnaire({
      id: newQuestionnaireId,
      title: title,
      description: description,
      questions: questions,
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
    }
  }
};

export const main = middyfy(createQuestionnaireHandler);
