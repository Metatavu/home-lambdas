import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import ArticlesApiService from "src/database/services/articles-api-service";
import { middyfy } from "src/libs/lambda";

const dynamoDb = new DocumentClient();
const articleService = new ArticlesApiService(dynamoDb);

/**
 * Handler for finding article entry in DynamoDB.
 *
 * @param event - API Gateway event containing the request body.
 * @returns Response object with status code
 */
export const findArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const {path} = event.pathParameters || {};

  if (!path) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing or invalid path parameter." }),
    };
  }

  try {
    const foundArticle = await articleService.findArticleByPath(path);

    if (!foundArticle) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Article ${path} not found.` })
      };
    };

    return {
      statusCode: 200,
      body: JSON.stringify(foundArticle),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to retrieve an article.",
        message: error.message,
      }),
    };
  }
};

export const main = middyfy(findArticleHandler);