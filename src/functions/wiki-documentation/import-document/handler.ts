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
/**
 * Converts a string into a URL-safe slug segment.
 * @param value Title value
 */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-");

/**
 * Makes sure that uploaded file is PDF
 * @returns API error response when invalid; otherwise `undefined`.
 */

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

/**
 * Extracts text from PDF bytes and normalizes it into markdown.
 *
 * @param bytes - PDF file content as bytes.
 * @returns Normalized markdown-like text content.
 */

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
  const { documentTitle } = payload;

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
    if (!bytes) {
      return {
        statusCode: 422,
        headers: responseHeaders,
        body: JSON.stringify({ message: "PDF is empty" })
      };
    }

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

    const now = new Date().toISOString();

    const article = {
      id: uuidv4(),
      path: basePath,
      title: documentTitle,
      description: "Imported from PDF",
      content: markdown,
      createdBy: userId,
      createdAt: now,
      lastUpdatedBy: userId,
      lastUpdatedAt: now,
      lastReadAt: now,
      readBy: [userId],
      tags: [],
      draft: false,
      coverImage: undefined
    };

    await articlesApiService.createArticle(article);

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ path: basePath })
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
