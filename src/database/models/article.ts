/**
 * Interface for an article.
 */
export interface ArticleModel {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  createdBy: string;
  createdAt: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  tags: string[];
  readBy: string[];
}