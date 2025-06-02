import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService, PipedriveApiService } from "src/database/services/pipedrive-api-service";
import { Lead } from "src/types/pipedrive/lead";

/**
 * Response schema for Leads
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
 * Lists all Leads from Pipedrive API
 * 
 * @param api What api service you wnat to use.
 * @returns List of Leads
 */
const listLeads = async (api: PipedriveApiService): Promise<Response[]> => {

    const leads = await api.getAllLeads();

    return leads.map(lead => {
        return { 
            leadId: lead.leadId,
            title: lead.title,
            interested: lead.interested,
            usedTech: lead.usedTech,
            addTime: lead.addTime,
            updateTime: lead.updateTime,
            nextActivityDate: lead.nextActivityDate,
            labelIds: lead.labelIds
        }
    })
}

/**
 * Handles Lead fetching
 * 
 * @returns Status code 200 and the leads object array
 */
const listLeadsHandler: ValidatedEventAPIGatewayProxyEvent<Lead> = async () => {
    
    const api = CreatePipedriveApiService();
    const leads = await listLeads(api);

    return {
        statusCode: 200,
        body: JSON.stringify(leads)
    };
}

export const main = middyfy(listLeadsHandler);