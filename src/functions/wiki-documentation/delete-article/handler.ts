import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import ArticlesApiService from "src/database/services/articles-api-service";
import { middyfy } from "src/libs/lambda";
import { isAdminUser } from "src/libs/auth-utils";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const articleService = new ArticlesApiService(docClient);

/**
 * Handler for deleting an article entry in DynamoDB.
 *
 * @param event - API Gateway event.
 */
const deleteArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  if (!isAdminUser(event)) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        code: 403,
        message: "Access denied. Admin privileges required.",
      }),
    };
  }
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