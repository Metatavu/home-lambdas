import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { ArticleModel } from "src/database/models/article";
import { articlesApiService } from "src/database/services";
import { getAuthDataFromToken, isAdminUser } from "src/libs/auth-utils";
import { middyfy } from "src/libs/lambda";
import { v4 as uuidv4 } from "uuid";

type ImportMode = "single" | "by-toc" | "by-toc-linked";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

async function fetchPdfFromS3(s3Path: string): Promise<Buffer> {
  const { HOME_BUCKET_NAME, HOME_BUCKET_REGION } = process.env;
  if (!HOME_BUCKET_NAME) throw new Error("HOME_BUCKET_NAME env var is not set");

  const client = new S3Client({ region: HOME_BUCKET_REGION });
  const result = await client.send(new GetObjectCommand({ Bucket: HOME_BUCKET_NAME, Key: s3Path }));

  if (!result.Body) throw new Error(`Empty S3 response for key: ${s3Path}`);

  const chunks: Uint8Array[] = [];
  // @ts-expect-error – Body is a Node.js readable stream
  for await (const chunk of result.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  const pdfjsLib = require("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    useWorkerFetch: false,
    isEvalSupported: false
  }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items as TextItem[])
      .map((item) => item.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push(text);
  }

  return pages.join("\n\n");
}

const importDocumentHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  if (!isAdminUser(event)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ code: 403, message: "Access denied. Admin privileges required." })
    };
  }

  const authData = getAuthDataFromToken(event);
  const createdBy = authData?.sub || "unknown";
  const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  const { Path, documentTitle, importMode = "by-toc", overwriteExisting = false } = body || {};

  if (!Path || !documentTitle) {
    return {
      statusCode: 400,
      body: JSON.stringify({ code: 400, message: "Path and documentTitle are required." })
    };
  }

  const validModes: ImportMode[] = ["single", "by-toc", "by-toc-linked"];
  if (!validModes.includes(importMode)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: `importMode must be one of: ${validModes.join(", ")}.`
      })
    };
  }

  try {
    const pdfBuffer = await fetchPdfFromS3(Path);
    const fullText = await extractTextFromPdf(pdfBuffer);

    const documentSlug = slugify(documentTitle);
    const articlePath = `documents/${documentSlug}`;
    const now = new Date().toISOString();

    const existing = await articlesApiService.findArticleByPath(articlePath);

    if (existing && !overwriteExisting) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          code: 409,
          message: `Article already exists at path: ${articlePath}. Set overwriteExisting=true to update.`
        })
      };
    }

    const article: ArticleModel = {
      id: existing?.id || uuidv4(),
      path: articlePath,
      title: documentTitle,
      content: `# ${documentTitle}\n\n${fullText}`,
      description: fullText.substring(0, 160),
      createdBy: existing?.createdBy || createdBy,
      createdAt: existing?.createdAt || now,
      lastUpdatedBy: createdBy,
      lastUpdatedAt: now,
      draft: false,
      tags: [documentSlug],
      importGroup: documentSlug,
      order: 0,
      parentPath: undefined
    };

    if (existing) {
      await articlesApiService.updateArticle(article);
    } else {
      await articlesApiService.createArticle(article);
    }

    const { content: _content, ...metadata } = article;

    return {
      statusCode: 200,
      body: JSON.stringify({
        basePath: articlePath,
        importMode,
        created: existing ? 0 : 1,
        skipped: 0,
        articles: [metadata]
      })
    };
  } catch (error) {
    console.error("Import document error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 500,
        message: `Failed to import document: ${(error as Error).message}`
      })
    };
  }
};

export const main = middyfy(importDocumentHandler);
