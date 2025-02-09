import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import ArticlesApiService from "src/database/services/articles-api-service";
import { middyfy } from "src/libs/lambda";

const dynamoDb = new DocumentClient();
const articleService = new ArticlesApiService(dynamoDb);

export const listArticlesHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { queryStringParameters } = event;
    if (!queryStringParameters) {
      const articleList = await articleService.listArticles();

      return {
        statusCode: 200,
        body: JSON.stringify(articleList),
      }
    }

    const { userId, tagId } = queryStringParameters;
    const articleList = await articleService.listArticles(userId || tagId);

    return {
      statusCode: 200,
      body: JSON.stringify(articleList),
    }
  } catch(error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve article list.', details: error.message }),
    }
  }
};

export const main = middyfy(listArticlesHandler);