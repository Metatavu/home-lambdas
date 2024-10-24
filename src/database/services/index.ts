import createDynamoDBClient from "../client";
import QuestionnaireService from "./questionnaire-api-service";
import VacationRequestService from "@database/services/vacation-request-api-service";


export const questionnaireService = new QuestionnaireService(createDynamoDBClient());
export const vacationRequestService = new VacationRequestService(createDynamoDBClient());