import fetch from "node-fetch";
import { TrelloCards, TrelloComment, TrelloList, TrelloMembers } from "../schema/trello";

/**
 * Class that implements Trello Service for card operations.
 */
export class TrelloService {
  private readonly apiKey = process.env.TRELLO_API_KEY;
  private readonly apiToken = process.env.TRELLO_TOKEN;
  private readonly baseUrl = "https://api.trello.com/1";
  private readonly boardId = process.env.TRELLO_MANAGEMENT_BOARD_ID;

  /**
   * Creates a card on the specified Trello list
   *
   * @param title card title
   * @param description card description
   * @returns Trello card
   */
  public async createCard(title: string, description?: string): Promise<any> {
    const listId = await this.getListIdByName("Memo");
    const response = await fetch(`${this.baseUrl}/cards?key=${this.apiKey}&token=${this.apiToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idList: listId,
        name: title,
        desc: description,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create card: ${response.status} - ${response.statusText}`
      );
    }
    
    return await response.json();
  }

  /**
   * Gets card comments
   *
   * @param cards cards object
   * @returns Trello board
   */
  public async getCardsComments(cards: TrelloCards[]): Promise<[TrelloComment[]]> {
    const comments = await Promise.all(
      cards.map(async card => {
        const url = `${this.baseUrl}/cards/${card.cardId}/actions?filter=commentCard&key=${this.apiKey}&token=${this.apiToken}`;

        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const commentsData = await response.json();

        return commentsData.map(comment => ({
          createdBy: comment.idMemberCreator || "",
          text: comment.data.text || "",
        }));
      })
    )
    return comments;
  }

  /**
   * Creates a comment to a card
   *
   * @param comment card comment
   * @param cardId card ID
   * @returns card comment
   */
  public async createComment(comment: string, cardId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/cards/${cardId}/actions/comments?text=${comment}&key=${this.apiKey}&token=${this.apiToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: comment
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create comment: ${response.status} - ${response.statusText}`
      );
    }
    return await response.json();
  }

  /**
   * Deletes a card on the specified Trello list
   *
   * @param cardId card ID
   * @return deletion result
   */
  public async deleteCard(cardId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/cards/${cardId}?key=${this.apiKey}&token=${this.apiToken}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: cardId
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to delete card: ${response.status} - ${response.statusText}`
      );
    }
    return await response.json();
  }

  /**
   * Lists Trello lists
   *
   * @returns lists
   */
  public async getListsOnBoard(): Promise<TrelloList[]> {
    const response = await fetch(`${this.baseUrl}/boards/${this.boardId}/lists?key=${this.apiKey}&token=${this.apiToken}`, {
      method: "GET",
    });
  
    if (!response.ok) throw new Error(`Failed to fetch lists: ${response.status} - ${response.statusText}`);
    const listsData = await response.json();
    const lists: TrelloList[] = listsData.map((list: any) => ({
      id: list.id,
      name: list.name,
      idBoard: list.idBoard,
    }));
    console.log("lists:", lists)
    return lists;
  }

  /**
   * Lists specified Trello list
   *
   * @param name  list name
   * @returns list content
   */
  public getListIdByName = async (name: string) => {
    const lists = await this.getListsOnBoard();
    const listFound = lists.find(list => list.name == name);
    return listFound.id;
  }

  /**
   * Lists Trello cards on a list
   *
   * @param listId  Trello ID list
   * @returns cards
   */
    public async getCardsOnList(): Promise<TrelloCards[]> {
      const listId = await this.getListIdByName("Memo");
      const url = `${this.baseUrl}/lists/${listId}/cards?key=${this.apiKey}&token=${this.apiToken}`;
  
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      
      return data.map((card: any) => ({
        cardId: card.shortLink,
        title: card.name,
        description: card.desc,
        assignedPersons: card.idMembers || [],
      }));
    }

  /**
   * Fetches email addresses of all users related to a specific board
   *
   * @returns emails
   */
  public async getBoardMembers(): Promise<TrelloMembers[]> {
    const response = await fetch(`${this.baseUrl}/boards/${this.boardId}/members?key=${this.apiKey}&token=${this.apiToken}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch board members: ${response.status} - ${response.statusText}`);
    }
    const members = await response.json();

    const emails = members.map((member: any) => {
      const fullName = member.fullName.toLowerCase().split(" ");
      const [name, surname] = fullName;
      return {
        memberId: member.id,
        fullName: member.fullName,
        email: `${name}.${surname}@metatavu.fi`
      }
    });
    return emails;
  }
}