import Config from "src/app/config";
import fetch from "node-fetch";
export const CreatePipedriveApiService = () => {
    const apiKey = Config.get().pipedriveApi.apiKey;
    const apiUrl = Config.get().pipedriveApi.apiUrl;
    return {
        async getAllLeads() {
            const response = await fetch(`${apiUrl}/leads/?archived_status=not_archived&api_token=${apiKey}`);
            const leads = await response.json();
            return leads.data;
        },
        async getDeals(status) {
            const response = await fetch(`${apiUrl}/deals/?status=${status}&api_token=${apiKey}`);
            const deals = await response.json();
            return deals.data;
        },
        async getLeadById(id) {
            const response = await fetch(`${apiUrl}/leads/?${id}&api_token=${apiKey}`);
            const lead = await response.json();
            return lead.data;
        },
        async getDealById(id) {
            const response = await fetch(`${apiUrl}/deals/${id}?api_token=${apiKey}`);
            const deal = await response.json();
            return deal;
        },
        async addDealInterestById(id, interest) {
            const response = await fetch(`${apiUrl}/deals/${id}?api_token=${apiKey}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "9f6a98bf5664693aa24a0e5473bef88e1fae3cb3": interest })
            });
            return response.json();
        },
        async addLeadInterestById(id, interest) {
            const response = await fetch(`${apiUrl}/leads/${id}?api_token=${apiKey}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "9f6a98bf5664693aa24a0e5473bef88e1fae3cb3": interest }),
            });
            return response.json();
        },
        async removeDealInterestById(id, interest) {
            const response = await fetch(`${apiUrl}/deals/${id}?api_token=${apiKey}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "9f6a98bf5664693aa24a0e5473bef88e1fae3cb3": interest })
            });
            return response.json();
        },
        async removeLeadInterestById(id, interest) {
            const response = await fetch(`${apiUrl}/leads/${id}?api_token=${apiKey}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "9f6a98bf5664693aa24a0e5473bef88e1fae3cb3": interest })
            });
            return response.json();
        }
    };
};
//# sourceMappingURL=pipedrive-api-service.js.map