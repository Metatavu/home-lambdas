import { middyfy } from "@libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import type { ArticleModel } from "src/database/models/article";
import * as jwt from 'jsonwebtoken';
import { articlesApiService } from "src/database/services";
import type { Article } from "src/generated/homeLambdasModels/model/article";

/**
 * Handler for updating an article entry in DynamoDB.
 *
 * @param event - API Gateway event.
 * @returns Response object with status code
 */
const updateArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const token = event.headers?.Authorization?.split(" ")[1];
  const decodedJWT = jwt.decode(token);
  const isAdmin = decodedJWT?.realm_access.roles?.includes("admin") || false;

  const { pathParameters, body } = event;
  const { path, title, content, description, coverImage, tags, lastUpdatedBy, draft } =
    typeof body === "string" ? JSON.parse(body) : body;
  const id = pathParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        messge: "Missing or invalid 'id' path parameter."
      })
    };
  }

  const existingArticle = await articlesApiService.findArticleById(id);
  if (!existingArticle) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        code: 404,
        message: `Article ${id} not found.`
      })
    };
  }

  const articleExistsWithPath = await articlesApiService.findArticleByPath(path);
  if (articleExistsWithPath && articleExistsWithPath.id !== id) {
    return {
      statusCode: 409,
      body: JSON.stringify({
        code: 409,
        message: `Article with the path ${path} already exists.`
      })
    };
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
    lastUpdatedBy: lastUpdatedBy,
    lastUpdatedAt: new Date().toISOString(),
    lastReadAt: existingArticle.lastReadAt,
    draft: isAdmin && draft
  };

  try {
    await articlesApiService.updateArticle(updatedArticle);
    return {
      statusCode: 200,
      body: JSON.stringify(updatedArticle)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 500,
        message: `Error updating article with id ${id}: ${error.message}`
      })
    };
  }
};

export const main = middyfy(updateArticleHandler);
