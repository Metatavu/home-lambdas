import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService } from "src/database/services/pipedrive-api-service";
const getDealById = async (api, id) => {
    const deal = await api.getDealById(id);
    return (deal);
};
const getDealByIdHandler = async (event) => {
    const paramDealId = parseInt(event.pathParameters.id);
    const paramApiService = CreatePipedriveApiService();
    const res = await getDealById(paramApiService, paramDealId);
    return {
        statusCode: 200,
        body: JSON.stringify(res)
    };
};
export const main = middyfy(getDealByIdHandler);
//# sourceMappingURL=handler.js.map