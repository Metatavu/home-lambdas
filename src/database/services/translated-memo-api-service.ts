import {
  type DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";
import type { MemoInput, MemoRecord } from "src/database/models/memo-record";
import { v4 as uuidv4 } from "uuid";

const TABLE_NAME = "Memos";

/**
 * Service for managing translated memo PDFs in DynamoDB.
 *
 * Provides methods to store and retrieve memo records.
 */
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
  public storeMemoRecord = async (memo: MemoInput, isOriginal = false): Promise<MemoRecord> => {
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
  public getTranslatedMemoRecord = async (
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

  /**
   * Retrieves a memo by its file ID and language.
   *
   * Queries the "FileIdIndex" GSI to check if a memo already exists for
   * the given file and language. This is used to avoid creating duplicate
   * records for the same memo in different languages.
   *
   * @param fileId - The Google Drive file ID associated with the memo.
   * @param language - The language of the memo.
   *
   * @returns The `item.id` if found, or `null` if no matching memo exists.
   */
  public getByFileIdAndLanguage = async (
    fileId: string,
    language: string
  ): Promise<string | null> => {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "FileIdIndex",
        KeyConditionExpression: "#fileId = :fileId AND #lang = :language",
        ExpressionAttributeNames: {
          "#fileId": "fileId",
          "#lang": "language"
        },
        ExpressionAttributeValues: {
          ":fileId": fileId,
          ":language": language
        }
      })
    );
    const item = result.Items?.[0];
    return item?.id || null;
  };
}

export default TranslatedMemoService;
