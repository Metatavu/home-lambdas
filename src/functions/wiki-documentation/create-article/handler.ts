import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ArticleModel } from "src/database/models/article";
import { middyfy } from "src/libs/lambda";
import { v4 as uuidv4 } from "uuid";
import ArticlesApiService from "src/database/services/articles-api-service";

const dynamoDb = new DocumentClient();
const articleService = new ArticlesApiService(dynamoDb);

export const createArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Request body is required.' }),
    };
  }

  const {
    path,
    title,
    content,
    createdBy,
    description,
    coverImage,
    tags,
  } = (typeof event.body === "string" ? JSON.parse(event.body) : event.body);

  if (!path || !title || !content || !createdBy) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Some required data is missing." })
    };
  }

  try {
    const articleExistsWithPath = await articleService.findArticleByPath(path);
    if (articleExistsWithPath) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: `Article with the path ${path} already exists.`
        })
      }
    }

    const createdAt = new Date().toISOString();
    const newArticle: ArticleModel = {
      id: uuidv4(),
      path: path,
      title: title,
      description: description,
      content: content,
      coverImage: coverImage,
      createdBy: createdBy,
      createdAt: createdAt,
      lastUpdatedBy: createdBy,
      lastUpdatedAt: createdAt,
      lastReadAt: createdAt,
      tags: tags || [],
      group: "article"
    };

    const articleCreated = await articleService.createArticle(newArticle);
    return {
      statusCode: 200,
      body: JSON.stringify(articleCreated),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to create new article.", 
        message: error.message 
      })
    };
  }
};

export const main = middyfy(createArticleHandler);