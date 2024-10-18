import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService, PipedriveApiService } from "src/database/services/pipedrive-api-service";
import { Deal } from "src/types/pipedrive/deal";

/**
 * Response schema for Deals
 */
interface Response {
    id: number;
    title: string;
    interested: string;
    value: number;
    currency: string;
    addTime: string; 
    updateTime: string; 
    nextActivityDate: string; 
    status: string;
    nextActivitySubject: string;
    nextActivityNote: string;
}

/**
 * 
 * @param api Choose what ApiService to use
 * @param status Defines what deals to fetch
 * @returns Array of deals that match for the status
 */
const listDeals = async (api: PipedriveApiService, status: string): Promise<Response[]> => {

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
        }
    })
}
/**
 * Handles listing deals
 * 
 * @param event Gives you the parameter
 * @returns Status code 200 and an Array of deals
 */
const listDealsHandler: ValidatedEventAPIGatewayProxyEvent<Deal> = async(event) => {

    const paramStatus = event.pathParameters.status;
    const api = CreatePipedriveApiService();
    const deals = await listDeals(api, paramStatus);
    return {
        statusCode: 200,
        body: JSON.stringify(deals)
    };
}

export const main = middyfy(listDealsHandler);