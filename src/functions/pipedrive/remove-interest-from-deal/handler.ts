import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService, PipedriveApiService } from "src/database/services/pipedrive-api-service";
import { Interest } from "src/types/pipedrive/interest";

/**
 * Parameter schema for Removing Deal interest
 */
interface RemoveInterestFromDealParameters {
  rowtype: string,
  userId: string,
  dealId: string,
  existingInterest: string
}

/**
 * Removes the wanted userId from the interested string
 * 
 * @param api What api to use
 * @param param Moving paremeters object to forward
 * @returns Success message
 */
const removeInterestFromDeal = async (api: PipedriveApiService, param: RemoveInterestFromDealParameters): Promise<string> => {

  let updatedInterested = "";
  let userIdsArray = param.existingInterest.split(";");
  // Remove any empty strings from the array
  userIdsArray = userIdsArray.filter(id => id !== "");
  const indexToRemove = userIdsArray.indexOf(param.userId);

  if (indexToRemove !== -1) {
    userIdsArray.splice(indexToRemove, 1);
    updatedInterested = userIdsArray.join(";");
    updatedInterested += ";";
  }

  await api.removeDealInterestById(param.dealId, updatedInterested);

  return "Interest removed successfully";
};

/**
 * Handles the process of removeInterestFromDead
 * 
 * @param event Interest type of ValidatedAPIGatewayProxyEvent
 * @returns Status code 200 and status/error message
 */
const removeInterestFrmoDealHandler: ValidatedEventAPIGatewayProxyEvent<Interest> = async event => {
  const api = CreatePipedriveApiService();
  const getDataFromBody: RemoveInterestFromDealParameters = event.body as RemoveInterestFromDealParameters;
  const res = await removeInterestFromDeal(api, getDataFromBody);

  return {
    statusCode: 200,
    body: res
  };
}

export const main = middyfy(removeInterestFrmoDealHandler);