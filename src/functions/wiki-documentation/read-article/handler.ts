import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { middyfy } from "src/libs/lambda";
import ArticlesApiService from "src/database/services/articles-api-service";

const dynamoDb = new DocumentClient();
const articleService = new ArticlesApiService(dynamoDb);

/**
 * Handler for updating read list of article entry in DynamoDB.
 *
 * @param event - API Gateway event.
 * @returns Response with status code
 */
export const readArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        code: 400,
        meassage: "Request body is required."
      }),
    };
  }

  const { pathParameters, body } = event;
  const { userId } = (typeof body === "string" ? JSON.parse(body) : body);
  const id = pathParameters?.id;

  if (!userId)
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        code: 400,
        message: "Missing or invalid path parameter."
      })
    }

  try {
    const existedArticle = await articleService.findArticleById(id);
    if (!existedArticle) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          code: 404,
          message: `Article ${id} not found.`
        })
      }
    }

    await articleService.updateArticleReadBy(id, userId);
    return {
      statusCode: 200,
      body: "Successfully updated readBy for an article."
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        code: 500,
        message: `Failed to update readBy list for an article: ${error.message}`, 
      })
    };
  }
};

export const main = middyfy(readArticleHandler);