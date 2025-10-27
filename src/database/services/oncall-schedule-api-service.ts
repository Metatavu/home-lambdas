import {
  BatchWriteCommand,
  type DynamoDBDocumentClient,
  PutCommand,
  type PutCommandInput,
  QueryCommand,
  type QueryCommandInput,
  UpdateCommand,
  type UpdateCommandInput
} from "@aws-sdk/lib-dynamodb";
import type OnCallEntry from "../models/oncall";

/**
 * Database service for OnCallSchedule
 */
const TABLE_NAME = "OnCallSchedule";

class OnCallScheduleService {
  /**
   * Constructor
   * @param docClient DynamoDBDocumentClient
   */
  constructor(private readonly docClient: DynamoDBDocumentClient) {}

  /**
   * Creates OnCallSchedule entiries in batches of 25
   * @param entries OnCallSchedule entries
   * @returns created entires
   */
  public createOnCallBatchFromJSON = async (entries: OnCallEntry[]): Promise<OnCallEntry[]> => {
    const batches: OnCallEntry[][] = [];
    const batchSize = 25;

    for (let i = 0; i < entries.length; i += batchSize) {
      batches.push(entries.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const putRequests = batch.map((item) => ({ PutRequest: { Item: item } }));

      const params = {
        RequestItems: {
          [TABLE_NAME]: putRequests
        }
      };

      await this.docClient.send(new BatchWriteCommand(params));
    }

    return entries;
  };

  /**
   * Lists all OnCallSchedule entries for a given year
   *
   * @param year Year
   * @returns list of entries
   */
  public listOnCallSchedulesByYear = async (year: number): Promise<OnCallEntry[]> => {
    const params: QueryCommandInput = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "#yr = :year",
      ExpressionAttributeNames: {
        "#yr": "Year"
      },
      ExpressionAttributeValues: {
        ":year": year
      }
    };
    const result = await this.docClient.send(new QueryCommand(params));
    return (result.Items as OnCallEntry[]) || [];
  };

  /**
   * Updates paid status for an OnCallSchedule entry
   *
   * @param year Year
   * @param week Week
   * @param paid Paid status
   */
  public updatePaidStatus = async (year: number, week: number, paid: boolean): Promise<void> => {
    const params: UpdateCommandInput = {
      TableName: TABLE_NAME,
      Key: { Year: year, Week: week },
      UpdateExpression: "set Paid = :paid",
      ExpressionAttributeValues: {
        ":paid": paid
      }
    };
    await this.docClient.send(new UpdateCommand(params));
  };

  /**
   * Upserts (creates or updates) an OnCallSchedule entry for a specific year and week
   *
   * @param entry OnCallEntry
   * @returns upserted entry
   */
  public upsertSplunkOnCallSchedule = async (entry: OnCallEntry): Promise<OnCallEntry> => {
    const params: PutCommandInput = {
      TableName: TABLE_NAME,
      Item: entry
    };
    await this.docClient.send(new PutCommand(params));
    return entry;
  };
}

export default OnCallScheduleService;
