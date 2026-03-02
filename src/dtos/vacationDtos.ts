import type VacationRequestModel from "@database/models/vacationRequest";
import type { VacationRequest } from "src/generated/homeLambdasModels/model/vacationRequest";

const dtoToEntity = (dto: VacationRequest): VacationRequestModel => {
  return {
    id: dto.id,
    userId: dto.userId,
    draft: dto.draft,
    startDate: new Date(dto.startDate).toISOString(),
    endDate: new Date(dto.endDate).toISOString(),
    days: dto.days,
    type: dto.type,
    status: dto.status,
    message: dto.message,
    createdBy: dto.createdBy,
    createdAt: new Date(dto.createdAt).toISOString(),
    updatedAt: new Date(dto.updatedAt).toISOString()
  };
};

const entityToDto = (entity: VacationRequestModel): VacationRequest => {
  return {
    id: entity.id,
    userId: entity.userId,
    draft: entity.draft,
    startDate: new Date(entity.startDate).toISOString(),
    endDate: new Date(entity.endDate).toISOString(),
    days: entity.days,
    type: entity.type,
    status: entity.status,
    message: entity.message,
    createdBy: entity.createdBy,
    createdAt: new Date(entity.createdAt),
    updatedAt: new Date(entity.updatedAt)
  };
};

export { dtoToEntity, entityToDto };
