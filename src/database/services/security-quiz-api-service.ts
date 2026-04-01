import {
  type DynamoDBDocumentClient,
  GetCommand,
  type GetCommandInput,
  PutCommand,
  type PutCommandInput,
  QueryCommand,
  type QueryCommandInput
} from "@aws-sdk/lib-dynamodb";
import type { QuizAttempt } from "src/generated/homeLambdasModels/model/quizAttempt";
import type { UserStreakRecord } from "../models/user-streak-record";

const STREAK_TABLE = "UserStreaks";
const ATTEMPTS_TABLE = "QuizAttempts";

class SecurityQuizApiService {
  /**
   * Constructor
   * @param docClient DynamoDBDocumentClient
   */
  constructor(private readonly docClient: DynamoDBDocumentClient) {}
  /**
   * Retrieves the current streak of a user.
   * @param slackUserId - Slack ID of the user
   * @returns current streak (0 if none)
   */
  public getUserStreak = async (slackUserId: string): Promise<number> => {
    const params: GetCommandInput = {
      TableName: STREAK_TABLE,
      Key: { slack_user_id: slackUserId }
    };

    const result = await this.docClient.send(new GetCommand(params));
    return result.Item?.streak ?? 0;
  };

  /**
   * Saves or overwrites a user streak record
   * @param record - The user streak record to save
   */
  public putUserStreakRecord = async (record: UserStreakRecord): Promise<void> => {
    const params: PutCommandInput = {
      TableName: STREAK_TABLE,
      Item: record
    };

    await this.docClient.send(new PutCommand(params));
  };

  /**
   * Creates a quiz attempt record. Will fail if an attempt for the same user and date already exists.
   * @throws ConditionalCheckFailedException if an attempt for the same user and date already exists
   * @param attempt - The quiz attempt to create
   * @return void
   */
  public createQuizAttempt = async (attempt: QuizAttempt): Promise<void> => {
    const params: PutCommandInput = {
      TableName: ATTEMPTS_TABLE,
      Item: {
        slack_user_id: attempt.slackUserId,
        answered_correctly: attempt.answeredCorrectly,
        role: attempt.role,
        topic: attempt.topic,
        topic_key: attempt.topicKey,
        difficulty: attempt.difficulty,
        date: attempt.date
      },

      // prevents overwriting existing attempt
      ConditionExpression: "attribute_not_exists(slack_user_id) AND attribute_not_exists(#date)",
      ExpressionAttributeNames: {
        "#date": "date"
      }
    };

    await this.docClient.send(new PutCommand(params));
  };

  /**
   * Queries attempts for a user between startDate and endDate (inclusive)
   */
  public queryAttemptsByUser = async (
    slackUserId: string,
    startDate: string,
    endDate: string
  ): Promise<QuizAttempt[]> => {
    const params: QueryCommandInput = {
      TableName: ATTEMPTS_TABLE,
      KeyConditionExpression: "#user = :user AND #date BETWEEN :start AND :end",
      ExpressionAttributeNames: {
        "#user": "slack_user_id",
        "#date": "date"
      },
      ExpressionAttributeValues: {
        ":user": slackUserId,
        ":start": startDate,
        ":end": endDate
      }
    };

    const result = await this.docClient.send(new QueryCommand(params));
    return (result.Items || []).map((item) => ({
      slackUserId: item.slack_user_id,
      answeredCorrectly: item.answered_correctly,
      role: item.role,
      topic: item.topic,
      topicKey: item.topic_key,
      difficulty: item.difficulty,
      date: item.date
    }));
  };
}

export default SecurityQuizApiService;
