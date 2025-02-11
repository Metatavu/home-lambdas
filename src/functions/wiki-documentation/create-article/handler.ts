import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ArticleModel } from "src/database/models/article";
import ArticlesApiService from "src/database/services/articles-api-service";
import { middyfy } from "src/libs/lambda";
import { v4 as uuidv4 } from "uuid";

const dynamoDb = new DocumentClient();
const articleService = new ArticlesApiService(dynamoDb);

export const createArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    if (!event.body) {
      console.log('Request body is missing');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required.' }),
      };
    }

    const {
      title,
      description,
      content,
      createdBy,
      createdAt,
      coverImage,
      tags
    } = (typeof event.body === "string" ? JSON.parse(event.body) : event.body);

    if (!title || !content || !createdBy || !createdAt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Some required data is missing." })
      };
    }

    const newArticle: ArticleModel = {
      id: uuidv4(),
      title: title,
      description: description,
      content: content,
      coverImage: coverImage,
      createdBy: createdBy,
      createdAt: createdAt,
      lastUpdatedBy: createdBy,
      lastUpdatedAt: createdAt,
      tags: tags,
      type: "article"
    };

    const articleCreated = await articleService.createArticle(newArticle);

    return {
      statusCode: 200,
      body: JSON.stringify(articleCreated),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create new article entry.', details: error.message }),
    };
  }
};

export const main = middyfy(createArticleHandler);