import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService } from "src/database/services/pipedrive-api-service";
const addInterestToDeal = async (api, param) => {
    const newValue = param.userId + ";";
    let updatedInterested = "";
    if (param.existingInterest === null || param.existingInterest === "null" || param.existingInterest === "") {
        updatedInterested = newValue;
    }
    else {
        updatedInterested = param.existingInterest + newValue;
    }
    await api.addDealInterestById(param.dealId, updatedInterested);
    return "Interest added successfully";
};
const addInterestToDealHandler = async (event) => {
    const paramApi = CreatePipedriveApiService();
    const paramGetDataFromBody = event.body;
    const res = await addInterestToDeal(paramApi, paramGetDataFromBody);
    return {
        statusCode: 200,
        body: res
    };
};
export const main = middyfy(addInterestToDealHandler);
//# sourceMappingURL=handler.js.map