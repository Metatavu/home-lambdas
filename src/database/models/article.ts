interface User {
  id: string,
  firstName: string,
  lastName: string
}

interface Tag {
  id: string,
  name: string,
  color: string
}

/**
 * Interface for an article.
 */
export interface ArticleModel {
  id: string;
  sk: string;
  title: string;
  description?: string;
  content: string;
  coverImage?: string;
  createdBy: User;
  createdAt: string;
  lastUpdatedBy?: User;
  lastUpdatedAt?: string;
  tags?: Tag[];
  type: string;
}