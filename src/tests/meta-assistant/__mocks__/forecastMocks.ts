import { DateTime } from "luxon";
import type { NonProjectTime, TimeRegistrations } from "src/types/meta-assistant/index";

const dateNow = DateTime.now();

export const forecastMockNonProjectTimes: NonProjectTime[] = [
  {
    id: 123,
    name: "vacation",
    is_internal_time: false
  },
  {
    id: 124,
    name: "not vacation",
    is_internal_time: true
  },
  {
    id: 456,
    name: "something",
    is_internal_time: false
  }
];

export const forecastMockTimeRegistrations: TimeRegistrations[] = [
  {
    id: 16841456,
    person: 1,
    project: null,
    non_project_time: 228255,
    time_registered: 435,
    date: "2022-04-20",
    approval_status: "APPROVED"
  },
  {
    id: 17753014,
    person: 2,
    project: null,
    non_project_time: 280335,
    time_registered: 433,
    date: "2022-04-20",
    approval_status: "APPROVED"
  },
  {
    id: 17753014,
    person: 3,
    project: 86676,
    non_project_time: null,
    time_registered: 433,
    date: "2022-04-20",
    approval_status: "APPROVED"
  },
  {
    id: 17753014,
    person: 4,
    project: null,
    non_project_time: 123,
    time_registered: 433,
    date: "2022-04-20",
    approval_status: "APPROVED"
  },
  {
    id: 123,
    person: 123,
    non_project_time: 345,
    time_registered: 456,
    date: "22,22,22",
    approval_status: "sure"
  },
  {
    id: 100,
    person: 124,
    non_project_time: 123,
    time_registered: 100,
    date: dateNow.toISODate(),
    approval_status: "sure"
  }
];

export const forecastMockVacationTypes: TimeRegistrations[] = [
  {
    id: 34120867,
    person: 738579,
    project: null,
    non_project_time: 280335,
    time_registered: 435,
    date: "2024-03-21",
    approval_status: "APPROVED"
  },
  {
    id: 35089464,
    person: 738579,
    project: 364708,
    non_project_time: null,
    time_registered: 120,
    date: "2024-03-19",
    approval_status: "APPROVED"
  },
  {
    id: 35052291,
    person: 738579,
    project: 237102,
    non_project_time: null,
    time_registered: 30,
    date: "2024-03-18",
    approval_status: "APPROVED"
  },
  {
    id: 35056170,
    person: 738579,
    project: 237102,
    non_project_time: null,
    time_registered: 75,
    date: "2024-03-18",
    approval_status: "APPROVED"
  },
  {
    id: 35050870,
    person: 439678,
    project: 245123,
    non_project_time: 280330,
    time_registered: 435,
    date: "2024-03-25",
    approval_status: "APPROVED"
  },
  {
    id: 35051133,
    person: 439678,
    project: null,
    non_project_time: 280220,
    time_registered: 435,
    date: "2024-03-15",
    approval_status: "APPROVED"
  },
  {
    id: 35050809,
    person: 439678,
    project: null,
    non_project_time: 280316,
    time_registered: 435,
    date: "2024-03-18",
    approval_status: "APPROVED"
  },
  {
    id: 35051000,
    person: 439678,
    project: null,
    non_project_time: 280370,
    time_registered: 100,
    date: "2024-03-19",
    approval_status: "APPROVED"
  }
];

export const mockNonProjectTimes: NonProjectTime[] = [
  {
    id: 280316,
    name: "vacation",
    is_internal_time: false
  },
  {
    id: 280220,
    name: "child sickness",
    is_internal_time: false
  },
  {
    id: 280335,
    name: "paid off vacation",
    is_internal_time: false
  },
  {
    id: 280370,
    name: "sickness",
    is_internal_time: false
  }
];

export const expectedResults = [
  [738579, 435],
  [439678, 535]
];

export const forecastMockError = {
  status: 401,
  message: "Server failed to authenticate the request."
};
