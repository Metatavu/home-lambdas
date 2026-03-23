import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { middyfy } from "@libs/lambda";
import type { APIGatewayProxyHandler } from "aws-lambda";
import PDFParse from "pdf-parse";
import { articlesApiService } from "src/database/services";
import { getAuthDataFromToken } from "src/libs/auth-utils";
import { v4 as uuidv4 } from "uuid";

type ImportDocumentRequest = {
  Path?: string;
  path?: string;
  documentTitle?: string;
  overwriteExisting?: boolean;
};

const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-");

const validateFileType = (contentType: string | undefined, key: string) => {
  const isPdf = contentType === "application/pdf" || key.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return {
      statusCode: 422,
      headers: responseHeaders,
      body: JSON.stringify({ message: "Only PDF files are allowed" })
    };
  }
};

const getBucketEnv = () => {
  const { HOME_BUCKET_NAME, HOME_BUCKET_REGION } = process.env;

  if (!HOME_BUCKET_NAME || !HOME_BUCKET_REGION) {
    return {
      error: {
        statusCode: 500,
        headers: responseHeaders,
        body: JSON.stringify({
          code: 500,
          message: "Invalid lambda environment variables"
        })
      }
    };
  }

  return {
    HOME_BUCKET_NAME,
    HOME_BUCKET_REGION
  };
};

const extractMarkdownFromPdf = async (bytes: Uint8Array) => {
  const buffer = Buffer.from(bytes);
  const parsed = await PDFParse(buffer);
  return parsed.text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n\n");
};

const importDocumentHandler: APIGatewayProxyHandler = async (event) => {
  // ADMIN ONLY NEEDS TO BE ADDED LATER

  if (!event.body) {
    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ message: "Body required" })
    };
  }

  const env = getBucketEnv();

  const { HOME_BUCKET_NAME, HOME_BUCKET_REGION } = env;

  let payload: ImportDocumentRequest;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ message: "Invalid JSON" })
    };
  }

  const path = payload.path || payload.Path;
  const { documentTitle, overwriteExisting } = payload;

  if (!path || !documentTitle) {
    return {
      statusCode: 400,
      headers: responseHeaders,
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

    const validationResponse = validateFileType(file.ContentType, path);
    if (validationResponse) {
      return validationResponse;
    }

    const bytes = await file.Body?.transformToByteArray();

    const markdown = await extractMarkdownFromPdf(new Uint8Array(bytes));
    if (!markdown) {
      return {
        statusCode: 422,
        headers: responseHeaders,
        body: JSON.stringify({ message: "No content extracted" })
      };
    }

    const userId = getAuthDataFromToken(event)?.sub || "system";
    const basePath = `/wiki/${slugify(documentTitle)}`;
    if (!basePath) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ message: "Invalid document title" })
      };
    }

    const existing = await articlesApiService.findArticleByPath(basePath);
    if (existing && !overwriteExisting) {
      return {
        statusCode: 409,
        headers: responseHeaders,
        body: JSON.stringify({ message: "Article already exists" })
      };
    }

    const now = new Date().toISOString();

    const article = {
      id: existing?.id ?? uuidv4(),
      path: basePath,
      title: documentTitle,
      description: `Imported from PDF`,
      content: markdown,
      createdBy: existing?.createdBy ?? userId,
      createdAt: existing?.createdAt ?? now,
      lastUpdatedBy: userId,
      lastUpdatedAt: now,
      lastReadAt: existing?.lastReadAt ?? now,
      readBy: existing?.readBy ?? [userId],
      tags: existing?.tags ?? [],
      draft: existing?.draft ?? false,
      coverImage: existing?.coverImage
    };

    if (existing) {
      await articlesApiService.updateArticle(article);
    } else {
      await articlesApiService.createArticle(article);
    }

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        path: basePath,
        created: existing ? 0 : 1,
        updated: existing ? 1 : 0
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({
        message: error instanceof Error ? error.message : "Import failed"
      })
    };
  }
};

export const main = middyfy(importDocumentHandler);
