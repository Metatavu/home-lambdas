/**
 * Interface for Trello cards
 */
export interface TrelloCards {
  cardId: string,
  title: string,
  description: string,
  assignedPersons: string[],
}

/**
 * Interface for Trello card comment
 */
export interface TrelloComment {
  createdBy: string,
  text: string,
}

/**
 * Interface for Trello board members
 */
export interface TrelloMembers {
  memberId: string,
  fullName: string,
  email: string
}

/**
 * Extended interface for a Trello card with comments.
 */
export interface TrelloCardWithComments extends TrelloCards {
  comments: TrelloComment[];
}

/**
 * Interface for Trello list
 */
export interface TrelloList {
  id: string,
  name: string,
  idBoard: string,
}