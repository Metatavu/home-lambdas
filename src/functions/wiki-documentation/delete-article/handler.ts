import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import ArticlesApiService from "src/database/services/articles-api-service";
import { middyfy } from "src/libs/lambda";

const dynamoDb = new DocumentClient();
const articleService = new ArticlesApiService(dynamoDb);

/**
 * Handler for deleting an article entry in DynamoDB.
 *
 * @param event - API Gateway event.
 */
const deleteArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { id } = event.pathParameters || {};
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: "Missing or invalid 'id' path parameter.",
      }),
    };
  }

  try {
    const articleFoundById = await articleService.findArticleById(id);
    if (!articleFoundById) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          code: 404,
          message: `Article ${id} not found.`,
        }),
      };
    };

    await articleService.deleteArticle(id);
    return { 
      statusCode: 200,
      body: "Successfully deleted article."
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 500,
        message: `Failed to delete article: ${error.message}`
      }),
    };
  }
};

export const main = middyfy(deleteArticleHandler);