import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService, PipedriveApiService } from "src/database/services/pipedrive-api-service";
import { Interest } from "src/types/pipedrive/interest";

/**
 * Parameters structure for Leads
 */
interface AddInterestToLeadParameters {
    rowtype: string,
    userId: string,
    leadId: string,
    existingInterest: string
}

/**
 * Adds interest to a lead
 * 
 * @param api What ApiService does this function use.
 * @param param Parameter object that has: rowtype, userId, leadId and the existingInterest string
 * @returns Success message
 */
const addInterestToLead = async (api: PipedriveApiService, param: AddInterestToLeadParameters): Promise<string> => {

    const newValue = param.userId + ";";
    let updatedInterested = "";

    if (param.existingInterest === null || param.existingInterest === "null" || param.existingInterest === "") {
      updatedInterested = newValue;
    }
    else {
      updatedInterested = param.existingInterest + newValue;
    }
  
    await api.addLeadInterestById(param.leadId, updatedInterested );

    return "Interest added successfully";
};

/**
 * Handles the modification of the interest string
 * 
 * @param event Interest type of ValidatedAPIGatewayProxyEvent
 * @returns Status code 200 and changed object
 */
const addInterestToLeadHandler: ValidatedEventAPIGatewayProxyEvent<Interest> = async event => {
    const paramApi = CreatePipedriveApiService();
    const paramGetDataFromBody: AddInterestToLeadParameters = event.body as AddInterestToLeadParameters;
    const lead = await addInterestToLead(paramApi, paramGetDataFromBody);
    
    return {
        statusCode: 200,
        body: lead     
    };
}

export const main = middyfy(addInterestToLeadHandler);