import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import ArticlesApiService from "src/database/services/articles-api-service";
import { middyfy } from "src/libs/lambda";

const dynamoDb = new DocumentClient();
const articleService = new ArticlesApiService(dynamoDb);

export const createArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { queryStringParameters } = event;

    return {
      statusCode: 200,
      body: JSON.stringify({}),
    }
  } catch(error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve article list.', details: error.message }),
    }
  }
};

export const main = middyfy(createArticleHandler);