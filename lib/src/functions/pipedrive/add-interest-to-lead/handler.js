import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService } from "src/database/services/pipedrive-api-service";
const addInterestToLead = async (api, param) => {
    const newValue = param.userId + ";";
    let updatedInterested = "";
    if (param.existingInterest === null || param.existingInterest === "null" || param.existingInterest === "") {
        updatedInterested = newValue;
    }
    else {
        updatedInterested = param.existingInterest + newValue;
    }
    await api.addLeadInterestById(param.leadId, updatedInterested);
    return "Interest added successfully";
};
const addInterestToLeadHandler = async (event) => {
    const paramApi = CreatePipedriveApiService();
    const paramGetDataFromBody = event.body;
    const lead = await addInterestToLead(paramApi, paramGetDataFromBody);
    return {
        statusCode: 200,
        body: lead
    };
};
export const main = middyfy(addInterestToLeadHandler);
//# sourceMappingURL=handler.js.map