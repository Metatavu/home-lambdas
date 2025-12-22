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
 * Lambda handler to create and store the original PDF content of a memo in DynamoDB.
 *
 * @param event - API Gateway event containing request information.
 *   - `queryStringParameters.fileId` The ID of the Google Drive file to retrieve.
 * @returns Response object with:
 *   - `statusCode: 200` on success, body contains `message` and stored memo `id`.
 *   - Other status codes (`400`, `404`, `500`) indicate errors.
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
    const file = await getFile(fileId);
    if (!file) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "File not found on Drive" })
      };
    }

    // Placeholder: default original language, detection can be added later
    const originalLanguage = "fi";

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
    const storedMemo = await memoService.storeMemoRecord(originalMemo, true);

    // TODO: Translate PDF and store translated version
    // Uncomment and implement proper logic when translation service is ready
    // try {
    // const translatedPdf = await getTranslatedPdf(pdfFile);
    // const translatedBase64 = translatedPdf.content.toString("base64");
    //   const translatedBase64 = "is this translated?";
    //   const translatedMemo = {
    //     id: storedMemo.id,
    //     fileId: file.id,
    //     fileName: file.name,
    //     language: "en", // or dynamically from translation service
    //     translatedBase64: translatedBase64
    //   };
    //   await memoService.storeMemoRecord(translatedMemo);
    // } catch (error) {
    //   return {
    //     statusCode: 500,
    //     body: JSON.stringify({ error: "Failed to translate and store PDF", details: error.message })
    //   };
    // }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Translated memo content created successfully",
        id: storedMemo.id
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
