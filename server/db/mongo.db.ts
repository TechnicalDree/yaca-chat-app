// This is the real database, using MongoDB and Mongoose
// It can be initialized with a MongoDB URL pointing to a production or development/test database

import DAC, { IDatabase } from './dac';
import mongoose from 'mongoose';
import { Schema, model } from 'mongoose';
import { IUser } from '../../common/user.interface';
import { IChatMessage } from '../../common/chatMessage.interface';
import { IAppError } from '../../common/server.responses';
import { INote } from '../../common/note.interface';

// Temporarily this class delegates all operations to an instance of in-memory DB
// Remove in-memory completely after implementing ALL mongoDB methods
import { InMemoryDB } from './inMemory.db'; // remove later

const UserSchema = new Schema<IUser>({
  // TODO
  credentials: {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  extra: { type: String, required: false },
  _id: { type: String, required: true } // required in DB
});

const ChatMessageSchema = new Schema<IChatMessage>({
  // TODO
  author: { type: String, required: true },
  text: { type: String, required: true },
  displayName: { type: String, required: false },
  timestamp: { type: String, required: false },
  _id: { type: String, required: true }
});

const NoteSchema = new Schema<INote>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  _id: { type: String, required: true } // required in DB
});

const MUser = model<IUser>('User', UserSchema);
const MNote = model<INote>('Note', NoteSchema);
const MChatMessage = model<IChatMessage>('Message', ChatMessageSchema);

export class MongoDB implements IDatabase {
  public dbURL: string;

  private tempDB: IDatabase = new InMemoryDB(); // remove later

  private db: mongoose.Connection | undefined;

  constructor(dbURL: string) {
    this.dbURL = dbURL;
  }

  async connect(): Promise<void> {
    // TODO
    try {
      await mongoose.connect(this.dbURL);
      this.db = mongoose.connection;
      console.log('Connected to MongoDB');

      this.db.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });
    } catch (error) {
      console.error('MongoDB connection error: ', error);
      throw error;
    }
  }

  async init(): Promise<void> {
    // TODO
    if (this.db == undefined) throw new Error('MongoDB is undefined');
    try {
      const collections = this.db.collections;
      for (const index in collections) {
        await collections[index].deleteMany({});
      }
      console.log('MongoDB collections cleared');
    } catch (error) {
      console.error('Error clearing MongoDB collections: ', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // TODO
    if (this.db) {
      await this.db.close();
      console.log('Disconnected from MongoDB');
    }
  }

  async saveUser(user: IUser): Promise<IUser> {
    // TODO
    try {
      const newUser = new MUser(user);
      const savedUser = await newUser.save();
      return structuredClone(savedUser.toObject());
    } catch (error) {
      console.error('Error saving user: ', error);
      throw error;
    }
  }

  async findUserByUsername(username: string): Promise<IUser | null> {
    // TODO
    try {
      const user = await MUser.findOne({
        'credentials.username': username
      }).exec();
      if (user) {
        return structuredClone(user?.toObject());
      }
      return null;
    } catch (error) {
      console.error('Error finding user by username: ', error);
      throw error;
    }
  }

  async findAllUsers(): Promise<IUser[]> {
    // TODO
    try {
      const users = await MUser.find({}).exec();
      return structuredClone(users.map((user: IUser & mongoose.Document) => user.toObject()));
    } catch (error) {
      console.error('Error finding all users: ', error);
      throw error;
    }
  }

  async saveChatMessage(message: IChatMessage): Promise<IChatMessage> {
    // TODO
    try {
      const newMessage = new MChatMessage(message);
      const savedMessage = await newMessage.save();
      return structuredClone(savedMessage.toObject());
    } catch (error) {
      console.error('Error saving chat message: ', error);
      throw error;
    }
  }

  async findAllChatMessages(): Promise<IChatMessage[]> {
    // TODO
    try {
      const messages = await MChatMessage.find({}).exec();
      return structuredClone(messages.map((message: IChatMessage & mongoose.Document) => message.toObject()));
    } catch (error) {
      console.error('Error finding all chat message: ', error);
      throw error;
    }
  }

  async findChatMessageById(_id: string): Promise<IChatMessage | null> {
    // TODO
    try {
      const message = await MChatMessage.findById(_id).exec();
      if (message) {
        return structuredClone(message.toObject());
      }
      return null;
    } catch (error) {
      console.error('Error finding chat message by ID: ', error);
      throw error;
    }
  }

  async deleteUser(username: string): Promise<boolean> {
    try {
      const result = await MUser.deleteOne({
        'credentials.username': username
      }).exec();
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting user: ', error);
      throw error;
    }
  }

  async deleteChatMessagesByAuthor(author: string): Promise<number> {
    try {
      const result = await MChatMessage.deleteMany({
        author: author
      }).exec();
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting chat messages by author: ', error);
      throw error;
    }
  }

  async saveNote(note: INote): Promise<INote> {
    const newNote = new MNote(note);
    const savedNote: INote = await newNote.save();
    return savedNote;
  }

  async getAllNotes(): Promise<INote[]> {
    const notes = await MNote.find({}).exec();
    return notes;
  }

  async findNoteById(id: string): Promise<INote | null> {
    const note = await MNote.findById(id).exec();
    return note;
  }
  async filterNotes(regexString: string): Promise<INote[]> {
    const regex = new RegExp(regexString, 'i');
    const notes = await MNote.find({ description: regex }).exec();
    return notes;
  }
  static async getNoteById(noteId: string): Promise<INote | null> {
    return DAC.db.findNoteById(noteId);
  }
  static async filter(regexString: string): Promise<INote[]> {
    return DAC.db.filterNotes(regexString);
  }
}
