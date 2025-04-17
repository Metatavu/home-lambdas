import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService } from "src/database/services/pipedrive-api-service";
const removeInterestFromLead = async (api, param) => {
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
const removeInterestFrmoLeadHandler = async (event) => {
    const paramApi = CreatePipedriveApiService();
    const ParamGetDataFromBody = event.body;
    const res = await removeInterestFromLead(paramApi, ParamGetDataFromBody);
    return {
        statusCode: 200,
        body: res
    };
};
export const main = middyfy(removeInterestFrmoLeadHandler);
//# sourceMappingURL=handler.js.map