// This is the model for chat messages
// It is used by the controllers to access functionality related chat messages, including database access

import DAC from '../db/dac';
import { v4 as uuidV4 } from 'uuid';
import { IChatMessage } from '../../common/chatMessage.interface';
import { IUser } from '../../common/user.interface';
import { IAppError } from '../../common/server.responses';
import { User } from './user.model';

export class ChatMessage implements IChatMessage {
  public timestamp: string;
  public _id: string;

  constructor(
    public author: string,
    public text: string,
    public displayName?: string
  ) {
    // TODO
    this.timestamp = new Date().toISOString();
    this._id = uuidV4();
  }

  async post(): Promise<IChatMessage> {
    // TODO
    // return { _id: '', author: '', text: '', timestamp: '' };
    const authorUser = await User.getUserForUsername(this.author);
    if (!authorUser) {
      const error: IAppError = {
        type: 'ClientError',
        name: 'OrphanedChatMessage',
        message: 'Cannot post a message for a non-existent user.'
      };
      throw error;
    }

    this.displayName = authorUser.extra || this.author;

    const savedMessage = await DAC.db.saveChatMessage(this);
    return savedMessage;
  }

  static async getAllChatMessages(): Promise<IChatMessage[]> {
    // TODO
    const messages = await DAC.db.findAllChatMessages();
    return messages;
  }

  // TODO
  static async getChatMessageById(_id: string): Promise<IChatMessage | null> {
    const message = await DAC.db.findChatMessageById(_id);
    return message;
  }
}
