// Controller serving the chat room page and handling the loading, posting, and update of chat messages
// Note that controllers don't access the DB direcly, only through the models

import Controller from './controller';
import { ILogin, IUser } from '../../common/user.interface';
import { User } from '../models/user.model';
import { ChatMessage } from '../models/chatMessage.model';
import { IChatMessage } from '../../common/chatMessage.interface';
import { NextFunction, Request, Response } from 'express';
import * as responses from '../../common/server.responses';
import jwt from 'jsonwebtoken';
import { JWT_KEY } from '../env';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: { username: string };
    }
  }
}

export default class ChatController extends Controller {
  public constructor(path: string) {
    super(path);
  }

  public initializeRoutes(): void {
    // this should define the routes handled by the middlewares chatRoomPage,
    // authenticate, getAllUsers, getUser, postMessage, and getAllMessages
    // TODO
    this.router.get('/', this.chatRoomPage);
    this.router.get('/messages', this.authorize, this.getAllMessages);
    this.router.post('/messages', this.authorize, this.postMessage);
    this.router.get('/users/:username', this.authorize, this.getUser);
  }

  public chatRoomPage(req: Request, res: Response) {
    res.redirect('/pages/chat.html');
  }

  public authorize(req: Request, res: Response, next: NextFunction) {
    // TODO - check if the user is logged in by validating token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        type: 'ClientError',
        name: 'MissingToken',
        message: 'Authorization token is required.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_KEY) as { username: string };
      req.user = decoded; // Add user info to request
      next();
    } catch (error) {
      return res.status(401).json({
        type: 'ClientError',
        name: 'InvalidToken',
        message: 'Invalid or expired token.'
      });
    }
  }

  public async getAllUsers(req: Request, res: Response) {
    // TODO
    try {
      const users = await User.getAllUsers();
      res.status(200).json({
        name: 'UsersFound',
        payload: users
      });
    } catch (error) {
      res.status(500).json({
        type: 'ServerError',
        name: 'GetRequestFailure',
        message: 'Failed to retrieve users.'
      });
    }
  }

  public async getUser(req: Request, res: Response) {
    // TODO
    try {
      const { username } = req.params;
      const user = await User.getUserForUsername(username);

      if (!user) {
        return res.status(400).json({
          type: 'ClientError',
          name: 'UserNotFound',
          message: 'User not found.'
        });
      }

      res.status(200).json({
        name: 'UserFound',
        payload: user
      });
    } catch (error) {
      res.status(500).json({
        type: 'ServerError',
        name: 'GetRequestFailure',
        message: 'Failed to retrieve user.'
      });
    }
  }

  public async postMessage(req: Request, res: Response) {
    // TODO
    try {
      const { text, author } = req.body;
      const authenticatedUser = req.user as { username: string };

      // Validate required fields
      if (!text || text.trim() === '') {
        return res.status(400).json({
          type: 'ClientError',
          name: 'MissingChatText',
          message: 'Chat message text is required.'
        });
      }

      if (!author || author.trim() === '') {
        return res.status(400).json({
          type: 'ClientError',
          name: 'MissingAuthor',
          message: 'Author information is missing.'
        });
      }

      // Validate that the author matches the authenticated user
      if (author !== authenticatedUser.username) {
        return res.status(401).json({
          // Changed from 403 to 401
          type: 'ClientError',
          name: 'UnauthorizedRequest',
          message: 'You can only post messages on your own behalf.'
        });
      }

      // Create and post the chat message
      const chatMessage = new ChatMessage(author, text.trim());
      const savedMessage = await chatMessage.post();

      if (Controller.io) {
        Controller.io.emit('new-chat-message', savedMessage);
      }

      res.status(201).json({
        name: 'ChatMessageCreated',
        payload: savedMessage
      });
    } catch (error: unknown) {
      if (isClientError(error) && error.type === 'ClientError') {
        // Handle OrphanedChatMessage with 401
        if (error.name === 'OrphanedChatMessage') {
          return res.status(401).json(error);
        }
        res.status(400).json(error);
      } else {
        res.status(500).json({
          type: 'ServerError',
          name: 'PostRequestFailure',
          message: 'Failed to post chat message.'
        });
      }
    }
  }

  public async getAllMessages(req: Request, res: Response) {
    // TODO
    try {
      const messages = await ChatMessage.getAllChatMessages();
      
      if (messages.length === 0) {
        res.status(200).json({
          name: 'NoChatMessagesYet',
          payload: []
        });
      } else {
        res.status(200).json({
          name: 'ChatMessagesFound',
          payload: messages
        });
      }
    } catch (error) {
      res.status(500).json({
        type: 'ServerError',
        name: 'GetRequestFailure',
        message: 'Failed to retrieve chat messages.'
      });
    }
  }
}

type ClientError = { type: string; name: string; message: string };

function isClientError(error: unknown): error is ClientError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'name' in error &&
    'message' in error
  );
}

