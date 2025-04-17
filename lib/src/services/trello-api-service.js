import fetch from "node-fetch";
export class TrelloService {
    constructor() {
        this.apiKey = process.env.TRELLO_API_KEY;
        this.apiToken = process.env.TRELLO_TOKEN;
        this.baseUrl = "https://api.trello.com/1";
        this.boardId = process.env.TRELLO_MANAGEMENT_BOARD_ID;
        this.getListIdByName = async (name) => {
            const lists = await this.getListsOnBoard();
            const listFound = lists.find(list => list.name == name);
            return listFound.id;
        };
    }
    async createCard(title, description) {
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
            throw new Error(`Failed to create card: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    }
    async getCardsComments(cards) {
        const comments = await Promise.all(cards.map(async (card) => {
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
        }));
        return comments;
    }
    async createComment(comment, cardId) {
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
            throw new Error(`Failed to create comment: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    }
    async deleteCard(cardId) {
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
            throw new Error(`Failed to delete card: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    }
    async getListsOnBoard() {
        const response = await fetch(`${this.baseUrl}/boards/${this.boardId}/lists?key=${this.apiKey}&token=${this.apiToken}`, {
            method: "GET",
        });
        if (!response.ok)
            throw new Error(`Failed to fetch lists: ${response.status} - ${response.statusText}`);
        const listsData = await response.json();
        const lists = listsData.map((list) => ({
            id: list.id,
            name: list.name,
            idBoard: list.idBoard,
        }));
        console.log("lists:", lists);
        return lists;
    }
    async getCardsOnList() {
        const listId = await this.getListIdByName("Memo");
        const url = `${this.baseUrl}/lists/${listId}/cards?key=${this.apiKey}&token=${this.apiToken}`;
        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        return data.map((card) => ({
            cardId: card.shortLink,
            title: card.name,
            description: card.desc,
            assignedPersons: card.idMembers || [],
        }));
    }
    async getBoardMembers() {
        const response = await fetch(`${this.baseUrl}/boards/${this.boardId}/members?key=${this.apiKey}&token=${this.apiToken}`, {
            method: "GET",
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch board members: ${response.status} - ${response.statusText}`);
        }
        const members = await response.json();
        const emails = members.map((member) => {
            const fullName = member.fullName.toLowerCase().split(" ");
            const [name, surname] = fullName;
            return {
                memberId: member.id,
                fullName: member.fullName,
                email: `${name}.${surname}@metatavu.fi`
            };
        });
        return emails;
    }
}
//# sourceMappingURL=trello-api-service.js.map