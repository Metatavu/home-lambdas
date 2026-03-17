/**
* Paid year interface
*/
export interface PaidYear {
  [week: number]: boolean
}

/**
* Paid data interface
*/
export interface PaidData {
  [year: number]: PaidYear
}

/**
* On call entry interface
*/
export interface OnCallEntry {
  Week: number;
  Person: string;
}

/**
 * Request body interface
 */
export interface UpdatePaidRequestBody {
  year: number;
  week: number;
  paid: boolean;
}

/**
 * Schedule from Splunk
 */
export interface SplunkSchedule {
  team: {
    name: string;
    slug: string;
  },
  schedules: [
    {
      policy: {
        name: string;
        slug: string;
      },
      schedule: [
        {
          onCallUser: {
            username: string;
          },
          overrideOnCallUser?: {
            username: string;
          },
          onCallType: string;
          rotationName: string;
          shiftName: string;
          shiftRoll: string;
          rolls: [
            {
              start: string;
              end: string;
              onCallUser: {
                username: string;
              },
              isRoll: boolean
            }
          ]
        }
      ],
      overrides: any[]
    }
  ]
};