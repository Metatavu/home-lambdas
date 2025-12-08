import { type DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { MemoInput, MemoRecord } from "src/database/models/memo-record";
import { v4 as uuidv4 } from "uuid";

const TABLE_NAME = "TranslatedMemos";

class TranslatedMemoService {
  constructor(private readonly docClient: DynamoDBDocumentClient) {}

  /**
   * Stores a translated PDF in DynamoDB
   */
  public storeMemo = async (memo: MemoInput, isOriginal = false): Promise<MemoRecord> => {
    const id = isOriginal ? uuidv4() : memo.id;
    const newMemo: MemoRecord = {
      id,
      PK: `MEMO#${id}`,
      SK: `LANG#${memo.language}`,
      ...memo
    };
    await this.docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newMemo
      })
    );
    return newMemo;
  };

  /**
   * Retrieves a translated PDF by fileId
   */
  public getTranslatedPdf = async (
    id: string,
    targetLanguage: string
  ): Promise<MemoRecord | null> => {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: id,
          SK: targetLanguage
        }
      })
    );
    return (result.Item as MemoRecord) || null;
  };
}

export default TranslatedMemoService;
