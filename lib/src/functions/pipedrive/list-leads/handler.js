import { middyfy } from "@libs/lambda";
import { CreatePipedriveApiService } from "src/database/services/pipedrive-api-service";
const listLeads = async (api) => {
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
        };
    });
};
const listLeadsHandler = async () => {
    const api = CreatePipedriveApiService();
    const leads = await listLeads(api);
    return {
        statusCode: 200,
        body: JSON.stringify(leads)
    };
};
export const main = middyfy(listLeadsHandler);
//# sourceMappingURL=handler.js.map