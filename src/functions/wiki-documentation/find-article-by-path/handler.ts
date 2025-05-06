import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import ArticlesApiService from "src/database/services/articles-api-service";
import { middyfy } from "src/libs/lambda";

const dynamoDb = new DocumentClient();
const articleService = new ArticlesApiService(dynamoDb);

/**
 * Handler for finding article entry by path second index in DynamoDB.
 *
 * @param event - API Gateway event containing the request body.
 * @returns Response object with status code
 */
export const findArticleByPathHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { path } = event.queryStringParameters || {};

  if (!path) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        code: 400,
        message: "Missing or invalid path parameter." 
      }),
    };
  }

  try {
    const foundArticle = await articleService.findArticleByPath(path);

    if (!foundArticle) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          code: 404,
          message: `Article ${path} not found.` 
        })
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
        code: 500,
        message: `Failed to retrieve an article: ${error.message}`
      }),
    };
  }
};

export const main = middyfy(findArticleByPathHandler);