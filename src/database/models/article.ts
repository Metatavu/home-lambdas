/**
 * Interface for an article.
 */
export interface ArticleMetadataModel {
  id: string;
  path: string;
  title: string;
  description?: string;
  coverImage?: string;
  createdBy: string;
  createdAt?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  lastReadAt?: string;
  readBy?: string[];
  tags?: string[];
  draft: boolean;
  /** Import group this article belongs to – matches the document slug used during import (e.g. "security-policy") */
  importGroup?: string;
  /** Position of the article within its import group for ordered navigation */
  order?: number;
  /** Path of the parent article, enabling hierarchy display in the UI */
  parentPath?: string;
}

export interface ArticleModel extends ArticleMetadataModel {
  content: string;
}
