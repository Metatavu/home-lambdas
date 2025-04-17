import { middyfy } from '@libs/lambda';
import { CreatePipedriveApiService } from 'src/database/services/pipedrive-api-service';
const getLeadById = async (api, id) => {
    const lead = await api.getLeadById(id);
    return (lead);
};
const getLeadByIdHandler = async (event) => {
    const leadId = event.pathParameters.id;
    const paramApi = CreatePipedriveApiService();
    const res = await getLeadById(paramApi, leadId);
    return {
        statusCode: 200,
        body: JSON.stringify(res)
    };
};
export const main = middyfy(getLeadByIdHandler);
//# sourceMappingURL=handler.js.map