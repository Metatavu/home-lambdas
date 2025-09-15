import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import ArticlesApiService from "src/database/services/articles-api-service";
import { middyfy } from "src/libs/lambda";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const articleService = new ArticlesApiService(docClient);

/**
 * Handler for finding article entry in DynamoDB.
 *
 * @param event - API Gateway event containing the request body.
 * @returns Response object with status code
 */
export const findArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { id } = event.pathParameters || {};

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        code: 400,
        message: "Missing or invalid path parameter." 
      }),
    };
  }

  try {
    const foundArticle = await articleService.findArticleById(id);

    if (!foundArticle) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          code: 404,
          message: `Article ${id} not found.` 
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

export const main = middyfy(findArticleHandler);