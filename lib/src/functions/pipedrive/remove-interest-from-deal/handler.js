import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService } from "src/database/services/pipedrive-api-service";
const removeInterestFromDeal = async (api, param) => {
    let updatedInterested = "";
    let userIdsArray = param.existingInterest.split(";");
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
const removeInterestFrmoDealHandler = async (event) => {
    const api = CreatePipedriveApiService();
    const getDataFromBody = event.body;
    const res = await removeInterestFromDeal(api, getDataFromBody);
    return {
        statusCode: 200,
        body: res
    };
};
export const main = middyfy(removeInterestFrmoDealHandler);
//# sourceMappingURL=handler.js.map