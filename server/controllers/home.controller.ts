// Controller serving the home page

import Controller from './controller';
import { Request, Response } from 'express';
import { HOST, PORT } from '../env';

export default class HomeController extends Controller {
  public constructor(path: string) {
    super(path);
  }

  // Just redirection going on here, nothing fancy
  // Plus a an about page generated on the fly

  public initializeRoutes(): void {
    this.router.get('/', this.indexPage);
    this.router.get('/home', this.homePage);
    this.router.get('/about', this.aboutPage);
  }

  public indexPage(req: Request, res: Response): void {
    res.redirect('/pages/index.html');
  }

  public homePage(req: Request, res: Response): void {
    res.redirect('/');
  }

  public aboutPage(req: Request, res: Response): void {
    // const about: 'This is YACA Server';
    // TODO: generate and serve plain html containing the about string
    const aboutHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>About YACA</title>
      </head>
      <body>
          <h1>About YACA</h1>
          <p>YACA means Yet Another Chat App.</p>
          <p>YACA is running on ${HOST} at port ${PORT}.</p>
          <p>YACA is an Express.js app built using TypeScript, HTML, and CSS.</p>
          <p>This YACA version was created by Adrian at CMU as a class project for 18351/18651.</p>
      </body>
      </html>`;
    res.send(aboutHtml);
  }
}
