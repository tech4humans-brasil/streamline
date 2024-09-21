import { app, TimerFunctionOptions, TimerHandler } from "@azure/functions";
import { Connection } from "mongoose";
import mongo from "../services/mongo";
import AdminClient from "../models/admin/Client";

type AzureFunctionHandler = TimerHandler;

export type CronWrapperHandler = (
  conn: Connection,
  ...args: Parameters<TimerHandler>
) => Promise<void>;

export default class CronWrapper {
  private handler: CronWrapperHandler;

  constructor(handler: typeof CronWrapper.prototype.handler) {
    this.handler = handler;
  }

  private run: AzureFunctionHandler = async (myTimer, context) => {
    let connAdmin: Connection;

    try {
      connAdmin = await mongo.connectAdmin();

      const clients = await new AdminClient(connAdmin).model().find();

      const promiseRuns = clients.map((client) =>
        this.handler(mongo.connect(client.acronym), myTimer, context)
      );

      await Promise.all(promiseRuns);

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error(error));
    }
  };

  public configure = (configs: {
    name: string;
    options: Omit<TimerFunctionOptions, "handler">;
  }): this => {
    const { name, options } = configs;
    app.timer(name, {
      ...options,
      handler: this.run,
    });
    return this;
  };
}
