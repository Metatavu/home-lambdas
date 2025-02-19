import { middyfy } from "@libs/lambda";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ArticleModel } from "src/database/models/article";
import ArticlesApiService from "src/database/services/articles-api-service";

const dynamoDb = new DocumentClient();
const articleService = new ArticlesApiService(dynamoDb);

const updateArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { pathParameters, body } = event;
  const {
    path,
    title,
    content,
    description,
    coverImage,
    tags,
    updatedBy
  } = (typeof body === "string" ? JSON.parse(body) : body);
  const id = pathParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing or invalid 'id' path parameter." })
    };
  }

  const existingArticle = await articleService.findArticleById(id);
  if (!existingArticle) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: `Article ${id} not found.` })
    };
  }

  const articleExistsWithPath = await articleService.findArticleByPath(path);
  if (articleExistsWithPath) {
    return {
      statusCode: 409,
      body: JSON.stringify({
        message: `Article with the path ${path} already exists.`
      })
    }
  }

  const updatedArticle: ArticleModel = {
    id: existingArticle.id,
    createdBy: existingArticle.createdBy,
    createdAt: existingArticle.createdAt,
    readBy: existingArticle.readBy,
    path: path || existingArticle.path,
    title: title || existingArticle.title,
    content: content || existingArticle.content,
    description: description || existingArticle.description,
    coverImage: coverImage || existingArticle.coverImage,
    tags: tags || existingArticle.tags,
    lastUpdatedBy: updatedBy,
    lastUpdatedAt: new Date().toISOString(),
    lastReadAt: existingArticle.lastReadAt
  };

  try {
    await articleService.updateArticle(updatedArticle);
    return {
      statusCode: 200,
      body: JSON.stringify(updatedArticle)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Error updating article with id ${id}`,
        message: error.message
      })
    };
  }
};

export const main = middyfy(updateArticleHandler);