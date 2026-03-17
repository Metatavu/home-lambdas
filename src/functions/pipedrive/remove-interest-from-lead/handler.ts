import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService, PipedriveApiService } from "src/database/services/pipedrive-api-service";
import { Interest } from "src/types/pipedrive/interest";

/**
 * Parameter schema for Removing Interest from Lead
 */
interface RemoveInterestFromLeadParameters {
  rowtype: string,
  userId: string,
  leadId: string,
  existingInterest: string
}

/**
 * Removes the wanted userId from the interested string
 * 
 * @param api What api to use
 * @param param Moving paremeters object to forward
 * @returns Success message
 */
const removeInterestFromLead = async (api: PipedriveApiService, param: RemoveInterestFromLeadParameters): Promise<string> => {
  let updatedInterested = "";
  let userIdsArray = param.existingInterest.split(";");
  userIdsArray = userIdsArray.filter(id => id !== "");
  const indexToRemove = userIdsArray.indexOf(param.userId);

  if (indexToRemove !== -1) {
    userIdsArray.splice(indexToRemove, 1);
    updatedInterested = userIdsArray.join(";");
    updatedInterested += ";";
  }

  await api.removeLeadInterestById(param.leadId, updatedInterested);

  return "Interest removed successfully";
};

/**
 * 
 * @param event Interest type of ValidatedAPIGatewayProxyEvent
 * @returns Status code 200 and updated Interest object
 */
const removeInterestFrmoLeadHandler: ValidatedEventAPIGatewayProxyEvent<Interest> = async event => {
  const paramApi = CreatePipedriveApiService();
  const ParamGetDataFromBody: RemoveInterestFromLeadParameters = event.body as RemoveInterestFromLeadParameters;
  const res = await removeInterestFromLead(paramApi, ParamGetDataFromBody);

  return {
    statusCode: 200,
    body: res
  };
}

export const main = middyfy(removeInterestFrmoLeadHandler);