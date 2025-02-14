import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { middyfy } from "src/libs/lambda";
import ArticlesApiService from "src/database/services/articles-api-service";

const dynamoDb = new DocumentClient();
const articleService = new ArticlesApiService(dynamoDb);

export const listArticlesHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { queryStringParameters } = event;
    const articleList = await articleService.listArticles(queryStringParameters?.path);

    return {
      statusCode: 200,
      body: JSON.stringify(articleList)
    }
  } catch(error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve article list.', details: error.message }),
    }
  }
};

export const main = middyfy(listArticlesHandler);