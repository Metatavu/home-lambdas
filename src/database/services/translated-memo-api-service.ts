import { type DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { MemoInput, MemoRecord } from "src/database/models/memo-record";
import { v4 as uuidv4 } from "uuid";

const TABLE_NAME = "TranslatedMemos";

class TranslatedMemoService {
  constructor(private readonly docClient: DynamoDBDocumentClient) {}

  /**
   * Stores a translated PDF memo in DynamoDB.
   *
   * @param memo - The memo data to store, including `id`, `fileId`, `fileName`, `language`, and `translatedBase64`.
   * @param isOriginal - Whether this memo is the original version. If `true`, a new ID is generated.
   *
   * @returns The stored `MemoRecord`, including `id`, `PK`, `SK`, and all memo fields.
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
   * Retrieves a translated PDF memo from DynamoDB.
   *
   * @param id - The primary key of the memo (`MEMO#id`).
   * @param targetLanguage - The target language of the memo (`LANG#language`).
   *
   * @returns The `MemoRecord` if found, or `null` if no matching memo exists.
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
