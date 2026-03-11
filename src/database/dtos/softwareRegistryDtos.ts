import type { SoftwareRegistry } from "src/generated/homeLambdasModels/model/softwareRegistry";
import type { SoftwareModel } from "../models/software";

const dtoToEntity = (dto: SoftwareRegistry): SoftwareModel => {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    url: dto.url,
    image: dto.image,
    status: dto.status,
    review: dto.review,
    createdBy: dto.createdBy,
    createdAt: dto.createdAt ? new Date(dto.createdAt).toISOString() : undefined,
    lastUpdatedBy: dto.lastUpdatedBy,
    lastUpdatedAt: dto.lastUpdatedAt ? new Date(dto.lastUpdatedAt).toISOString() : undefined,
    recommend: dto.recommend,
    tags: dto.tags,
    users: dto.users
  };
};

const entityToDto = (entity: SoftwareModel): SoftwareRegistry => {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    url: entity.url,
    image: entity.image,
    status: entity.status,
    review: entity.review,
    createdBy: entity.createdBy,
    createdAt: entity.createdAt ? new Date(entity.createdAt) : undefined,
    lastUpdatedBy: entity.lastUpdatedBy,
    lastUpdatedAt: entity.lastUpdatedAt ? new Date(entity.lastUpdatedAt) : undefined,
    recommend: entity.recommend,
    tags: entity.tags,
    users: entity.users
  };
};

export { dtoToEntity, entityToDto };
