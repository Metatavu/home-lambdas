import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { middyfy } from "@libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { articlesApiService } from "src/database/services";
import { getAuthDataFromToken } from "src/libs/auth-utils";
import { extractMarkdownFromPdf, isPdfFile, slugify } from "src/utils/importDocument";
import { v4 as uuidv4 } from "uuid";

/**
 * Request payload for importing a document.
 */
type ImportDocumentRequest = {
  path?: string;
  documentTitle?: string;
  overwriteExisting?: boolean;
};

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ARTICLE_CONTENT_LENGTH = 200_000;

/**
 * Lambda function for importing a PDF from s3 and creating a wiki article from it.
 */
const importDocumentHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Body required" })
    };
  }

  const HOME_BUCKET_NAME = process.env.HOME_BUCKET_NAME;
  const HOME_BUCKET_REGION = process.env.HOME_BUCKET_REGION;

  if (!HOME_BUCKET_NAME || !HOME_BUCKET_REGION) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 500,
        message: "Invalid lambda environment variables"
      })
    };
  }

  let payload: ImportDocumentRequest;
  if (typeof event.body === "string") {
    try {
      payload = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid JSON" })
      };
    }
  } else {
    payload = event.body as unknown as ImportDocumentRequest;
  }

  const { path, documentTitle } = payload;

  if (!path || !documentTitle) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "path and documentTitle required" })
    };
  }

  const s3 = new S3Client({ region: HOME_BUCKET_REGION });

  try {
    const file = await s3.send(
      new GetObjectCommand({
        Bucket: HOME_BUCKET_NAME,
        Key: path
      })
    );

    if (!isPdfFile(file.ContentType, path)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Only PDF files are allowed" })
      };
    }

   if (!file.ContentLength || file.ContentLength === 0) {
      return {
        statusCode: 422,
        body: JSON.stringify({ message: "PDF is empty" })
      };
    }

    if (file.ContentLength > MAX_PDF_SIZE_BYTES) {
      return {
        statusCode: 413,
        body: JSON.stringify({
          message: `PDF too large. Maximum supported size is ${MAX_PDF_SIZE_BYTES / 1024 / 1024} MB`
        })
      };
    }

    console.info("Importing PDF", {
      path,
      documentTitle,
      contentType: file.ContentType,
      contentLength: file.ContentLength
    });

    const bytes = await file.Body?.transformToByteArray();
    if (!bytes) {
      return {
        statusCode: 422,
        body: JSON.stringify({ message: "PDF is empty" })
      };
    }

    const markdown = await extractMarkdownFromPdf(bytes);
    if (!markdown) {
      return {
        statusCode: 422,
        body: JSON.stringify({ message: "No content extracted" })
      };
    }

    const normalizedMarkdown =
      markdown.length > MAX_ARTICLE_CONTENT_LENGTH
        ? `${markdown.slice(0, MAX_ARTICLE_CONTENT_LENGTH)}\n\n[Content truncated during import]`
        : markdown;

    const authData = getAuthDataFromToken(event);
    if (!authData?.sub) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "Forbidden" })
      };
    }

    const userId = authData.sub;
    const basePath = `/wiki/${slugify(documentTitle)}`;
    const now = new Date().toISOString();

    const article = {
      id: uuidv4(),
      path: basePath,
      title: documentTitle,
      description: "Imported from PDF",
      content: normalizedMarkdown,
      createdBy: userId,
      createdAt: now,
      lastUpdatedBy: userId,
      lastUpdatedAt: now,
      lastReadAt: now,
      readBy: [],
      tags: [],
      draft: false,
      coverImage: undefined
    };

    await articlesApiService.createArticle(article);

    return {
      statusCode: 200,
      body: JSON.stringify({ path: basePath })
    };
  } catch (error) {
    console.error("Error importing document", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: "IMPORT_DOCUMENT_ERROR",
        message: "Import failed"
      })
    };
  }
};

export const main = middyfy(importDocumentHandler);
