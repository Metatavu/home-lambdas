import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";
import { memoService } from "src/database/services";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda to retrieve a memo PDF by memo ID and targetlanguage
 *
 */
const getTranslatedMemoHandler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const memoId = event.pathParameters?.id;
  const language = event.pathParameters?.language;

  if (!memoId || !language) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required path parameters: id or language" })
    };
  }

  try {
    const memo = await memoService.getTranslatedPdf(`MEMO#${memoId}`, `LANG#${language}`);
    if (!memo) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Memo not found" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: memo.id,
        fileId: memo.fileId,
        fileName: memo.fileName,
        language: memo.language,
        translatedBase64: memo.translatedBase64
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", details: error.message })
    };
  }
};

export const main = middyfy(getTranslatedMemoHandler);
