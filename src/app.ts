import express from "express";
import * as bodyParser from "body-parser"; // used to parse the form data that you pass in the request
import routes from "./routes";
import cors from "cors";
import { Constants } from './helpers/constants';
import { swaggerDefinition } from '../swagger';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';





/**
 * Class to create endpoint root
 */
class App {
  public app: express.Application;

  constructor() {
    const options = { swaggerDefinition, apis: [ "./src/routes/endpoints/coartSpec/*.ts", "./src/routes/endpoints/hd-wallets/*.ts" ] };
    const swaggerSpec = swaggerJSDoc(options);
    this.app = express(); // run the express instance and store in app
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    this.config();
  }

  private config(): void {

    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(
      bodyParser.urlencoded({
        extended: false
      })
    );

    this.app.get("/health", (_req, res) => {
      res.json({ status: "ok" });
    });

    this.app.use("/api", routes);
  }
}

export default new App().app;