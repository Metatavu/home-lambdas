import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService, PipedriveApiService } from "src/database/services/pipedrive-api-service";
import { Deal } from "src/types/pipedrive/deal";

/**
 * Response interface for a deal
 */
interface Response {
    id: number;
    title: string;
    interested: string;
    usedTech: string; 
    addTime: string;
    updateTime: string;
    nextActivityDate: string;
    nextActivitySubject?: string;
    nextActivityNote?: string;
    value: number;
    currency: string;
    status: string;
}

/**
 * 
 * @param api What ApiService you need
 * @param id Id of a deal you want to fetch
 * @returns array of data defined in Response interface
 */
const getDealById = async (api: PipedriveApiService, id: number): Promise<Response[]> => {
    const deal = await api.getDealById(id);

    return (deal);
};
/**
 * 
 * @param event Gives the parameters
 * @returns status code 200 and array of deal summary data
 */
const getDealByIdHandler: ValidatedEventAPIGatewayProxyEvent<Deal> = async (event) => {
    const paramDealId: number = parseInt(event.pathParameters.id);
    const paramApiService = CreatePipedriveApiService();
    const res = await getDealById(paramApiService, paramDealId);

    return {
        statusCode: 200,
        body: JSON.stringify(res)
    };
};

export const main = middyfy(getDealByIdHandler);