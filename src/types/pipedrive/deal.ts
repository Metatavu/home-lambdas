/**
 * Deal object 
 */
export interface Deal {
    id: number;
    title: string;
    interested: string;
    usedTech: string;
    value: number;
    currency: string;
    addTime: string; 
    updateTime: string; 
    nextActivityDate: string; 
    status: string;
    nextActivitySubject: string;
    nextActivityNote: string;
  }