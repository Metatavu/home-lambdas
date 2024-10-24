export interface LeadOrDeal {
  id: string;
  title: string;
  interested: string; // NOTE: Might need to be changed to pipedrive api item-key
  usedTech: string; // NOTE: Might need to be changed to pipedrive api item-key
  add_time: string; 
  update_time: string; 
  next_activity_date: string; 
  status: string; // Added from Deal
  next_activity_subject?: string;
  next_activity_note?: string;
  value?: number; // Added from Deal
  currency?: string; // Added from Deal
  label_ids?: string[]; // Added from Lead
}
