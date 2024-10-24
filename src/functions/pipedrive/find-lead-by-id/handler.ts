import { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { CreatePipedriveApiService, PipedriveApiService } from 'src/database/services/pipedrive-api-service';
import { Lead } from 'src/types/pipedrive/lead';

/**
 * Response structure for a lead
 */
interface Response {
    leadId: string;
    title: string;
    interested: string;
    usedTech: string;
    addTime: string;
    updateTime: string;
    nextActivityDate: string;
    labelIds: string[];
}

/**
 * 
 * @param api What ApiService you want/need to use
 * @param id Id of a lead you want to fetch
 * @returns A lead from Pipedrive
 */
const getLeadById = async (api: PipedriveApiService, id: string): Promise<Response[]> => {
    const lead = await api.getLeadById(id);

    return (lead);
};

/**
 * 
 * @param event Event that gives you parameters
 * @returns Status code 200 and an array of lead summary data
 */
const getLeadByIdHandler: ValidatedEventAPIGatewayProxyEvent<Lead> = async (event) => {
    const leadId: string = event.pathParameters.id;
    const paramApi = CreatePipedriveApiService();
    const res = await getLeadById(paramApi, leadId);

    return {
        statusCode: 200,
        body: JSON.stringify(res)
    };
};

export const main = middyfy(getLeadByIdHandler);