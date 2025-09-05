import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { middyfy } from "src/libs/lambda";
import ArticlesApiService from "src/database/services/articles-api-service";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const articleService = new ArticlesApiService(docClient);

/**
 * Handler for listing article entries from DynamoDB.
 *
 * @param event - API Gateway event.
 * @returns Response object with status code
 */
export const listArticlesHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { queryStringParameters } = event;
    const articleList = await articleService.listArticles(queryStringParameters?.draft, queryStringParameters?.pathPrefix);
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
      body: JSON.stringify({ 
        code: 500,
        message: `Failed to retrieve article list: ${error.message}` 
      }),
    }
  }
};

export const main = middyfy(listArticlesHandler);