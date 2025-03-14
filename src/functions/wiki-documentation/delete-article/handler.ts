import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import ArticlesApiService from "src/database/services/articles-api-service";
import { middyfy } from "src/libs/lambda";

const dynamoDb = new DocumentClient();
const articleService = new ArticlesApiService(dynamoDb);

const deleteArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { id } = event.pathParameters || {};
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing or invalid 'id' path parameter.",
      }),
    };
  }

  try {
    const articleFoundById = await articleService.findArticleById(id);
    if (!articleFoundById) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Article ${id} not found.`,
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
        error: "Failed to delete article.",
        message: error.message,
      }),
    };
  }
};

export const main = middyfy(deleteArticleHandler);