// an InMemory version of the database that you can use in early-stage development
// It's not persistent, but can be used for testing and debugging
// It allows you to evolve your application in the absense of a real database

import { IDatabase } from './dac';
import { IChatMessage } from '../../common/chatMessage.interface';
import { IUser } from '../../common/user.interface';
import { IAppError } from '../../common/server.responses';
import { INote } from '../../common/note.interface';

export class InMemoryDB implements IDatabase {
  users: IUser[] = [];
  chatMessages: IChatMessage[] = [];
  notes: INote[] = [];

  async connect(): Promise<void> {
    // TODO
  }

  async init(): Promise<void> {
    this.users = [];
    this.chatMessages = [];
  }

  async close(): Promise<void> {
    // TODO
  }

  async saveUser(user: IUser): Promise<IUser> {
    const userCopy = structuredClone(user);
    this.users.push(userCopy);
    return structuredClone(userCopy);
  }

  async findUserByUsername(username: string): Promise<IUser | null> {
    const found = this.users.find((u) => u.credentials.username === username);
    return found ? structuredClone(found) : null;
  }

  async findAllUsers(): Promise<IUser[]> {
    return structuredClone(this.users);
  }

  async saveChatMessage(message: IChatMessage): Promise<IChatMessage> {
    // TODO: must return a copy of the saved message
    const messageCopy = structuredClone(message);
    this.chatMessages.push(messageCopy);
    return structuredClone(messageCopy);
  }

  async findChatMessageById(_id: string): Promise<IChatMessage | null> {
    // TODO
    const found = this.chatMessages.find((msg) => msg._id === _id);
    return found ? structuredClone(found) : null;
  }

  async findAllChatMessages(): Promise<IChatMessage[]> {
    return structuredClone(this.chatMessages);
  }
  async saveNote(note: INote): Promise<INote> {
    this.notes.push(structuredClone(note));
    // copy the note before saving
    // or like this:
    // this.notes.push({ ...note }); // copy the note before saving
    // return { ... note }; // return a copy
    return structuredClone(note);
  }

  async getAllNotes(): Promise<INote[]> {
    /* copy before returning, either like this ... 
    const notes: INote[] = [];
    this.notes.forEach((note) => {
      // copy the notes before returning
      notes.push({ ...note });
    });
    return notes;
    */
    return structuredClone(this.notes); // or like this
  }

  async filterNotes(regex: string): Promise<INote[]> {
    const pattern = new RegExp(regex, 'i');
    // Filter notes where title or content matches the pattern
    const filtered = this.notes.filter(
      (note) => pattern.test(note.title) || pattern.test(note.description)
    );
    return structuredClone(filtered);
  }

  async findNoteById(id: string): Promise<INote | null> {
    const found = this.notes.find((note) => note._id === id);
    return found ? structuredClone(found) : null;
  }
}
