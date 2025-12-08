import { getFile, getFileContentPdf } from "@services/google-drive-api-service";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";
import { memoService } from "src/database/services";
import { middyfy } from "src/libs/lambda";

// import { getTranslatedPdf } from "./google-translate-service"; // Uncomment when ready

/**
 * Lambda to create/store original PDF in DynamoDB and later implemented translated version.
 */
const createTranslatedMemoPdfHandler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const fileId = event.queryStringParameters?.fileId;

  if (!fileId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required query parameter: fileId" })
    };
  }

  try {
    // Fetch file metadata from Drive
    const file = await getFile(fileId);
    if (!file) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "File not found on Drive" })
      };
    }

    // Placeholder: default original language, detection can be added later
    const originalLanguage = "fi";

    // Fetch PDF binary content
    const pdfFile = await getFileContentPdf(file);
    if (!pdfFile?.content) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Failed to fetch PDF content" })
      };
    }

    const originalBase64 = pdfFile.content.toString("base64");

    // Store original PDF in DynamoDB
    const originalMemo = {
      fileId: file.id,
      fileName: file.name,
      language: originalLanguage,
      translatedBase64: originalBase64
    };
    const StoredMemo = await memoService.storeMemo(originalMemo, true);

    // TODO: Translate PDF and store translated version
    // Uncomment and implement when translation service is ready
    try {
      // const translatedPdf = await getTranslatedPdf(pdfFile);
      // const translatedBase64 = translatedPdf.content.toString("base64");
      const translatedBase64 = "is this translated?";
      const translatedMemo = {
        id: StoredMemo.id,
        fileId: file.id,
        fileName: file.name,
        language: "en", // or dynamically from translation service
        translatedBase64: translatedBase64
      };
      await memoService.storeMemo(translatedMemo);
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to translate and store PDF", details: error.message })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Translated memo content created successfully",
        id: StoredMemo.id
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", details: error.message })
    };
  }
};

export const main = middyfy(createTranslatedMemoPdfHandler);
