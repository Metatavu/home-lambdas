import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService, PipedriveApiService } from "src/database/services/pipedrive-api-service";
import { Interest } from "src/types/pipedrive/interest";

/**
 * Parameters for adding interest string to deal  
 */
interface AddInterestToDealParameters {
  rowtype: string,
  userId: string,
  dealId: string,
  existingInterest: string
}

/**
 * Adds interest to a deal
 * 
 * @param api What ApiService does this function use.
 * @param param Parameter object that has: rowtype, userId, dealId and the sxistingInterest string
 * @returns Success message
 */
const addInterestToDeal = async (api: PipedriveApiService, param: AddInterestToDealParameters): Promise<string> => {

  const newValue = param.userId + ";";
  let updatedInterested = "";

  // When using a custom field first time it may be null. 
  // So if we just assume it is empty the added id will look like this: null1234-abcd-5678-efgh;
  if (param.existingInterest === null || param.existingInterest === "null" || param.existingInterest === "") {
    updatedInterested = newValue;
  }
  else {
    updatedInterested = param.existingInterest + newValue;
  }

  await api.addDealInterestById(param.dealId, updatedInterested);

  return "Interest added successfully";
};

/**
 * Handles the modification of the interest string
 * 
 * @param event Interest type of ValidatedAPIGatewayProxyEvent
 * @returns Status code 200 and ok message
 */
const addInterestToDealHandler: ValidatedEventAPIGatewayProxyEvent<Interest> = async event => {
  const paramApi = CreatePipedriveApiService()
  const paramGetDataFromBody: AddInterestToDealParameters = event.body as AddInterestToDealParameters;
  const res = await addInterestToDeal(paramApi, paramGetDataFromBody);

  return {
    statusCode: 200,
    body: res
  };
};

export const main = middyfy(addInterestToDealHandler);