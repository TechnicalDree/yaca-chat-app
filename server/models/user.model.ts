// This is the model for users
// It is used by the controllers to access functionality related users, including database access

import { ILogin, IUser } from '../../common/user.interface';
import { v4 as uuidV4 } from 'uuid';
import DAC from '../db/dac';
import { IAppError } from '../../common/server.responses';
import bcrypt from 'bcrypt';

export class User implements IUser {
  credentials: ILogin;

  extra?: string; // this carries the displayName of the user

  _id?: string;

  constructor(credentials: ILogin, extra?: string) {
    this.credentials = credentials;
    this.extra = extra;
    // _id will be assigned in join()
  }

  static validateEmail(email: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }

  static validatePassword(password: string): string | null {
    if (password.length < 4) {
      return 'Password must be at least 4 characters.';
    } else if (!/[a-zA-Z]/.test(password)) {
      return 'Password must contain at least one letter.';
    } else if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number.';
    } else if (!/[$%#@!*&~^\-+]/.test(password)) {
      return 'Password must contain at least one special character ($, %, #, @, !, *, &, ~, ^, -, +).';
    } else if (/[^a-zA-Z0-9$%#@!*&~^\-+]/.test(password)) {
      return 'Password contains invalid characters.';
    }
    return null;
  }

  async join(): Promise<IUser> {
    // Check for missing fields
    if (!this.extra) {
      throw {
        type: 'ClientError',
        name: 'MissingDisplayName',
        message: 'Display name is required.'
      };
    } else if (!this.credentials.username) {
      throw {
        type: 'ClientError',
        name: 'MissingUsername',
        message: 'Email is required.'
      };
    } else if (!this.credentials.password) {
      throw {
        type: 'ClientError',
        name: 'MissingPassword',
        message: 'Password is required.'
      };
    } else if (!User.validateEmail(this.credentials.username)) {
      throw {
        type: 'ClientError',
        name: 'InvalidUsername',
        message: 'Invalid username.'
      };
    } else {
      // Validate password
      const passwordError = User.validatePassword(this.credentials.password);
      if (passwordError) {
        throw {
          type: 'ClientError',
          name: 'WeakPassword',
          message: passwordError
        };
      } else {
        // Check if user exists
        const existing = await DAC.db.findUserByUsername(
          this.credentials.username
        );
        if (existing) {
          throw {
            type: 'ClientError',
            name: 'UserExists',
            message: 'User already exists.'
          };
        } else {
          // Assign _id and hash password
          this._id = uuidV4();
          const hashed = await bcrypt.hash(this.credentials.password, 10);
          this.credentials.password = hashed;

          const saved = await DAC.db.saveUser({
            credentials: this.credentials,
            _id: this._id,
            extra: this.extra
          });
          return {
            credentials: {
              username: saved.credentials.username,
              password: saved.credentials.password
            },
            _id: saved._id,
            extra: saved.extra
          };
        }
      }
    }
  }

  async login(): Promise<IUser> {
    // login to YACA with user credentials
    // TODO
    return { credentials: { username: '', password: 'obfuscated' } };
  }

  static async getAllUsernames(): Promise<string[]> {
    // get the usernames of all users
    // TODO
    const users = await DAC.db.findAllUsers();
    return users.map((user) => user.credentials.username);
  }

  static async getAllUsers(): Promise<IUser[]> {
    // get all users
    return await DAC.db.findAllUsers();
  }

  static async getUserForUsername(username: string): Promise<IUser | null> {
    // get the user having a given username
    // TODO
    return DAC.db.findUserByUsername(username);
  }
}
