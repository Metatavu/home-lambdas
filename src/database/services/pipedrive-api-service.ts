import { Deal } from "../../types/pipedrive/deal";
import { Lead } from "../../types/pipedrive/lead";
import { Interest } from "../../types/pipedrive/interest";
import Config from "src/app/config";
import fetch from "node-fetch";
/**
 * Holds all PipedriveApiService functions used to interact with Pipedrive API 
 */
export interface PipedriveApiService {
  getAllLeads: () => Promise<Lead[]>;
  getDeals: (status: string) => Promise<Deal[]>;
  getLeadById: (id: string) => Promise<Lead[]>;
  getDealById: (id: number) => Promise<Deal[]>;
  addDealInterestById: (id: string, interest: string) => Promise<Interest[]>;
  addLeadInterestById: (id: string, interest: string) => Promise<Interest[]>;
  removeDealInterestById: (id: string, interest: string) => Promise<Interest[]>;
  removeLeadInterestById: (id: string, interest: string) => Promise<Interest[]>;
}


/**
 * Creates PipedriveApiService
 */
export const CreatePipedriveApiService = (): PipedriveApiService => {
  const apiKey: string = Config.get().pipedriveApi.apiKey;
  const apiUrl: string = Config.get().pipedriveApi.apiUrl;
  return {

    /**
     * Gets all Leads from the pipedrive api
     *
     * @returns List of Leads
     */
    async getAllLeads(): Promise<Lead[]> {
      const response = await fetch(`${apiUrl}/leads/?archived_status=not_archived&api_token=${apiKey}`);
      const leads = await response.json(); 
      return leads.data;
    },

    /**
    * Get all deals from the pipedrive api with wanted status
    * 
    * @param status Status string can be open, won or lost 
    * @returns List of Deals
    */
    async getDeals(status: string): Promise<Deal[]> {
      const response = await fetch(`${apiUrl}/deals/?status=${status}&api_token=${apiKey}`);
      const deals = await response.json();
      return deals.data;
    },

    /**
     * 
     * @param id  Id used to get mored information of a lead 
     * @returns lead object
     */
    async getLeadById(id: string): Promise<Lead[]> {
      const response = await fetch(`${apiUrl}/leads/?${id}&api_token=${apiKey}`);
      const lead = await response.json();
      return lead.data;
    },

    /**
    * Get a deal from the pipedrive api by id
    * 
    * @param dealId numeric Id used to get mored information of a deal 
    * @returns Deal object 
    */
    async getDealById(id: number): Promise<Deal[]> {
      const response = await fetch(`${apiUrl}/deals/${id}?api_token=${apiKey}`);
      const deal = await response.json();
      return deal;
    },
   /**
    * Add interest to a deal
    * 
    * @param dealId Id as a number of the wanted deal to be updated 
    * @param interest string where userIds for those that are interested in porject are stored. userIds are separeted with semicolon.
    * @returns success message
    */
    async addDealInterestById(id: string, interest: string): Promise<Interest[]> {
      const response = await fetch(`${apiUrl}/deals/${id}?api_token=${apiKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({"9f6a98bf5664693aa24a0e5473bef88e1fae3cb3": interest}) // STRING IS THE VARIABLE KEY FOR INTEREST

      });
      return response.json();
    },
   /**
    * Add interest to a lead
    * 
    * @param leadId Id as a string of the wanted lead to be updated 
    * @param interest string where userIds for those that are interested in porject are stored. userIds are separeted with semicolon. 
    * @returns success message
    */
    async addLeadInterestById(id: string, interest: string): Promise<Interest[]> {
      const response = await fetch(`${apiUrl}/leads/${id}?api_token=${apiKey}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({"9f6a98bf5664693aa24a0e5473bef88e1fae3cb3": interest}),
      });
      return response.json();
    },
   /**
    * Remove interest from a deal
    *
    * @param dealId Id as a number of the wanted deal to be updated 
    * @param interest string where userIds for those that are interested in porject are stored. userIds are separeted with semicolon. 
    * @returns success message
    */
    async removeDealInterestById(id: string, interest: string): Promise<Interest[]> {
      const response = await fetch(`${apiUrl}/deals/${id}?api_token=${apiKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({"9f6a98bf5664693aa24a0e5473bef88e1fae3cb3": interest}) // STRING IS THE VARIABLE KEY FOR INTEREST

      });
      return response.json();
    },
   /**
    * Remove interest from a lead
    * 
    * @param leadId Id as a string of the wanted lead to be updated 
    * @param interest string where userIds for those that are interested in porject are stored. userIds are separeted with semicolon. 
    * @returns success message
    */
    async removeLeadInterestById(id: string, interest: string): Promise<Interest[]> {
      const response = await fetch(`${apiUrl}/leads/${id}?api_token=${apiKey}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({"9f6a98bf5664693aa24a0e5473bef88e1fae3cb3": interest})

      });
      return response.json();
    }

  }

}