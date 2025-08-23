// This is the model for history notes
// It is used by the controllers to access functionality related history notes, including database access
import DAC from '../db/dac';
import { INote } from '../../common/note.interface';
import { v4 as uuidV4 } from 'uuid';

export class Note implements INote {
  public _id?: string;

  public title: string;

  public description: string;

  public date: string;

  constructor(title: string, description: string, date: string) {
    this.title = title;
    this.description = description;
    this.date = date;
    this._id = uuidV4();
  }

  async save(): Promise<INote> {
    return DAC.db.saveNote(this);
  }

  static async getAllNotes(): Promise<INote[]> {
    return DAC.db.getAllNotes();
  }

  static async filter(regexString: string): Promise<INote[]> {
    return DAC.db.filterNotes(regexString);
  }

  static async getNoteById(noteId: string): Promise<INote | null> {
    return DAC.db.findNoteById(noteId);
  }
}
