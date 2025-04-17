import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { middyfy } from "src/libs/lambda";
import ArticlesApiService from "src/database/services/articles-api-service";

const dynamoDb = new DocumentClient();
const articleService = new ArticlesApiService(dynamoDb);

/**
 * Handler for listind article entries from DynamoDB.
 *
 * @param event - API Gateway event.
 * @returns Response object with status code
 */
export const listArticlesHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { queryStringParameters } = event;
    const articleList = await articleService.listArticles(queryStringParameters?.path);
    const sortedArticles = articleList.sort((article1, article2) => 
      new Date(article2.lastUpdatedAt).getTime() - new Date(article1.lastUpdatedAt).getTime()
    )

    return {
      statusCode: 200,
      body: JSON.stringify(sortedArticles)
    }
  } catch(error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve article list.', details: error.message }),
    }
  }
};

export const main = middyfy(listArticlesHandler);