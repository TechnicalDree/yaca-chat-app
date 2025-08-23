// Controller serving the athentication page and handling user registration and login
// Note that controllers don't access the DB direcly, only through the models

import { ILogin, IUser } from '../../common/user.interface';
import { User } from '../models/user.model';
import Controller from './controller';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { JWT_KEY, JWT_EXP } from '../env';
import * as responses from '../../common/server.responses';

export default class AuthController extends Controller {
  public constructor(path: string) {
    super(path);
  }

  public initializeRoutes(): void {
    // this should define the routes handled by the middlewares authPage, register, and login
    this.router.get('/', this.authPage);
    this.router.post('/users', this.register.bind(this));
    this.router.post('/tokens/:username', this.login.bind(this));
  }

  public async authPage(req: Request, res: Response) {
    res.redirect('/pages/auth.html');
  }

  public async register(req: Request, res: Response) {
    try {
      const { extra, email, password } = req.body;
      const username = email || req.body.credentials?.username;
      const userPassword = password || req.body.credentials?.password;
      const userExtra = extra || req.body.extra;

      if (!username) {
        return res
          .status(400)
          .json({
            type: 'ClientError',
            name: 'MissingUsername',
            message: 'Email is required.'
          });
      }
      if (!userPassword) {
        return res
          .status(400)
          .json({
            type: 'ClientError',
            name: 'MissingPassword',
            message: 'Password is required.'
          });
      }
      if (!userExtra) {
        return res
          .status(400)
          .json({
            type: 'ClientError',
            name: 'MissingDisplayName',
            message: 'Display name is required.'
          });
      }

      const user = new User({ username, password: userPassword }, userExtra);
      const created = await user.join();
      res.status(201).json({ name: 'UserRegistered', payload: created });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'type' in err &&
        err.type === 'ClientError'
      ) {
        res.status(400).json(err);
      } else {
        res
          .status(500)
          .json({
            type: 'ServerError',
            name: 'FailedRegistration',
            message: 'Registration failed.'
          });
      }
    }
  }

  public async login(req: Request, res: Response) {
    try {
      const username = req.params.username;
      const { password } = req.body;
      if (!username) {
        // Username missing
        return res
          .status(400)
          .json({
            type: 'ClientError',
            name: 'MissingUsername',
            message: 'Email is required.'
          });
      }
      if (!password) {
        // Password missing
        return res
          .status(400)
          .json({
            type: 'ClientError',
            name: 'MissingPassword',
            message: 'Password is required.'
          });
      }

      // Find user by username
      const user = await User.getUserForUsername(username);
      if (!user) {
        return res
          .status(400)
          .json({
            type: 'ClientError',
            name: 'UnregisteredUser',
            message: 'No such user was found.'
          });
      }
      // Compare password
      const match = await bcrypt.compare(password, user.credentials.password);
      if (!match) {
        return res
          .status(400)
          .json({
            type: 'ClientError',
            name: 'IncorrectPassword',
            message: 'No such user was found.'
          });
      }

      // Prepare JWT payload
      const payload = {
        _id: user._id,
        username: user.credentials.username,
        extra: user.extra
      };

      // Sign token
      const token = jwt.sign(payload, JWT_KEY);

      const safeUser = {
        ...user,
        credentials: {
          ...user.credentials,
          password: user.credentials.password
        }
      };
      res
        .status(200)
        .json({
          name: 'UserAuthenticated',
          payload: { user: safeUser, token }
        });
    } catch (err: unknown) {
      res
        .status(500)
        .json({
          type: 'ServerError',
          name: 'FailedLogin',
          message: 'Login failed.'
        });
    }
  }
}
