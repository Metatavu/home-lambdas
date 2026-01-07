import VacationRequestService from "@database/services/vacation-request-api-service";
import createDynamoDBClient from "../client";
import ArticlesApiService from "./articles-api-service";
import OnCallScheduleService from "./oncall-schedule-api-service";
import QuestionnaireService from "./questionnaire-api-service";
import SoftwareService from "./software-api-service";
import TranslatedMemoService from "./translated-memo-api-service";

export const questionnaireService = new QuestionnaireService(createDynamoDBClient());
export const vacationRequestService = new VacationRequestService(createDynamoDBClient());
export const onCallScheduleService = new OnCallScheduleService(createDynamoDBClient());
export const articlesApiService = new ArticlesApiService(createDynamoDBClient());
export const softwareService = new SoftwareService(createDynamoDBClient());
export const memoService = new TranslatedMemoService(createDynamoDBClient());
