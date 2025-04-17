import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService } from "src/database/services/pipedrive-api-service";
const listDeals = async (api, status) => {
    const deals = await api.getDeals(status);
    return deals.map(deal => {
        return {
            id: deal.id,
            title: deal.title,
            interested: deal.interested,
            value: deal.value,
            currency: deal.currency,
            addTime: deal.addTime,
            updateTime: deal.updateTime,
            nextActivityDate: deal.nextActivityDate,
            status: deal.status,
            nextActivitySubject: deal.nextActivitySubject,
            nextActivityNote: deal.nextActivityNote,
        };
    });
};
const listDealsHandler = async (event) => {
    const paramStatus = event.pathParameters.status;
    const api = CreatePipedriveApiService();
    const deals = await listDeals(api, paramStatus);
    return {
        statusCode: 200,
        body: JSON.stringify(deals)
    };
};
export const main = middyfy(listDealsHandler);
//# sourceMappingURL=handler.js.map