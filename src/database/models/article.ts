/**
 * Interface for an article.
 */
export interface ArticleMetadataModel {
  id: string;
  path: string;
  title: string;
  description: string;
  coverImage?: string;
  createdBy: string;
  createdAt?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  lastReadAt: string;
  tags?: string[];
  readBy?: string[];
}

export interface ArticleModel extends ArticleMetadataModel{
  content: string;
}