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
    createdAt: new Date(dto.createdAt).toISOString(),
    lastUpdatedBy: dto.lastUpdatedBy,
    lastUpdatedAt: new Date(dto.lastUpdatedAt).toISOString(),
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
    createdAt: new Date(entity.createdAt),
    lastUpdatedBy: entity.lastUpdatedBy,
    lastUpdatedAt: new Date(entity.lastUpdatedAt),
    recommend: entity.recommend,
    tags: entity.tags,
    users: entity.users
  };
};

export { dtoToEntity, entityToDto };
