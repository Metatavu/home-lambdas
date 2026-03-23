import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { middyfy } from "@libs/lambda";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { PDFParse } from "pdf-parse";
import { articlesApiService } from "src/database/services";
import { getAuthDataFromToken, isAdminUser } from "src/libs/auth-utils";
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

const validateEnv = () => {
  const bucket = process.env.HOME_BUCKET_NAME;
  const region = process.env.HOME_BUCKET_REGION;
  if (!bucket || !region) throw new Error("Invalid lambda environment variables");
  return { bucket, region };
};

const validateFileType = (contentType: string | undefined, key: string) => {
  const isPdf = contentType === "application/pdf" || key.toLowerCase().endsWith(".pdf");
  if (!isPdf) throw new Error("Only PDF files are allowed");
};

const saveArticle = async (
  basePath: string,
  documentTitle: string,
  markdown: string,
  existing: any,
  userId: string
) => {
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
  return { created: existing ? 0 : 1, updated: existing ? 1 : 0 };
};

const extractMarkdownFromPdf = async (bytes: Uint8Array) => {
  const parser = new PDFParse({ data: bytes });
  try {
    const parsed = await parser.getText();
    return parsed.text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n\n");
  } finally {
    await parser.destroy();
  }
};

const importDocumentHandler: APIGatewayProxyHandler = async (event) => {
  if (!isAdminUser(event)) {
    return {
      statusCode: 403,
      headers: responseHeaders,
      body: JSON.stringify({ message: "PDF import is allowed for admins only" })
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ message: "Body required" })
    };
  }

  let env: ReturnType<typeof validateEnv>;
  let payload: ImportDocumentRequest;
  try {
    env = validateEnv();
    payload = JSON.parse(event.body);
  } catch (error) {
    const isEnvError = error instanceof Error && error.message.includes("lambda");
    return {
      statusCode: isEnvError ? 500 : 400,
      headers: responseHeaders,
      body: JSON.stringify({
        message: isEnvError ? "Invalid lambda environment variables" : "Invalid JSON"
      })
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

  const s3 = new S3Client({ region: env.region });
  try {
    const file = await s3.send(
      new GetObjectCommand({
        Bucket: env.bucket,
        Key: path
      })
    );
    validateFileType(file.ContentType, path);

    const bytes = await file.Body?.transformToByteArray();
    if (!bytes?.length) throw new Error("Empty PDF");

    const markdown = await extractMarkdownFromPdf(new Uint8Array(bytes));
    if (!markdown) throw new Error("No content extracted");

    const userId = getAuthDataFromToken(event)?.sub || "system";
    const basePath = `/wiki/${slugify(documentTitle)}`;
    const existing = await articlesApiService.findArticleByPath(basePath);
    if (existing && !overwriteExisting) throw new Error("Article already exists");

    const result = await saveArticle(basePath, documentTitle, markdown, existing, userId);
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ path: basePath, ...result })
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    const statusCode = message.includes("exists")
      ? 409
      : message.includes("Empty") || message.includes("extracted")
        ? 422
        : 500;
    return { statusCode, headers: responseHeaders, body: JSON.stringify({ message }) };
  }
};

export const main = middyfy(importDocumentHandler);
