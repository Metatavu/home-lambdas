import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";
import { memoService } from "src/database/services";
import type { MemoRecord } from "src/generated/homeLambdasModels/model/memoRecord";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda handler to retrieve a translated memo PDF from DynamoDB.
 *
 * @param event - API Gateway event containing path parameters.
 * @returns Response object with:
 *   - `statusCode: 200` on success, body contains the `memoRecord` object.
 *   - Other status codes (`400`, `404`, `500`) indicate errors.
 */
const getTranslatedMemoPdfHandler: APIGatewayProxyHandlerV2 = async (
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

    const memoRecord: MemoRecord = {
      id: memo.id,
      fileId: memo.fileId,
      fileName: memo.fileName,
      language: memo.language,
      translatedBase64: memo.translatedBase64
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ memoRecord })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", details: error.message })
    };
  }
};

export const main = middyfy(getTranslatedMemoPdfHandler);
