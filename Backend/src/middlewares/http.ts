import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  HttpRequestParams,
  HttpFunctionOptions,
} from "@azure/functions";
import * as yup from "yup";
import res from "../utils/apiResponse";
import jwt from "../services/jwt";
import mongo from "../services/mongo";
import { Connection } from "mongoose";
import { IInstitute } from "../models/client/Institute";
import { Permissions } from "../services/permissions";
import { IUserRoles } from "../models/client/User";
import Sentry from "../services/sentry";
import LogRepository from "../repositories/Log";
import { ILog } from "../models/client/Log";

const hasBody = ["POST", "PUT", "PATCH"];

interface THttpRequest {
  body: Object;
  query: Object;
  params: HttpRequestParams;
  headers: Record<string, string>;
  method: string;
  url: string;
  user: User | null;
  bodyUsed: boolean;
}

interface User {
  id: string;
  name: string;
  matriculation: string;
  email: string;
  roles: IUserRoles;
  institutes: IInstitute[];
  slug: string;
  permissions: Array<string>;
}

export type HttpHandler = (
  conn: Connection,
  request: THttpRequest,
  context: InvocationContext
) => Promise<HttpResponseInit>;

type AzureFunctionHandler = (
  request: HttpRequest,
  context: InvocationContext
) => Promise<HttpResponseInit>;

type callbackSchema = (schema: typeof yup) => {
  body?: yup.ObjectSchema<yup.AnyObject>;
  query?: yup.ObjectSchema<yup.AnyObject>;
  headers?: yup.ObjectSchema<yup.AnyObject>;
  params?: yup.ObjectSchema<yup.AnyObject>;
};

const LOGGING = process.env.LOGGING === "true";

export default class Http {
  private handler: HttpHandler;
  private isPublic: boolean = false;
  private schemaValidator = yup.object().shape({
    body: yup.object().shape({}).nullable(),
    query: yup.object().shape({}).nullable(),
    params: yup.object().shape({}).nullable(),
    headers: yup.object().shape({}).nullable(),
  });
  private name: string;
  private permission: string;
  private conn: Connection | null = null;
  private log: ILog;

  constructor(handler: typeof Http.prototype.handler) {
    this.handler = handler;
  }
  private run: AzureFunctionHandler = async (request, context) => {
    try {
      const body = hasBody.includes(request.method) ? await request.json() : {};
      const query = Object.fromEntries(request.query.entries());
      const headers = Object.fromEntries(request.headers.entries());
      const params = request.params;
      let user: User = null;

      if (!this.isPublic) {
        user = jwt.verify(headers);

        if (this.permission) {
          const permissions = new Permissions(user.permissions);

          const hasPermission = permissions.hasPermission(this.permission);

          if (!hasPermission) {
            throw {
              status: 403,
              message: "You don't have permission to access this resource",
            };
          }
        }
      }

      await this.schemaValidator
        .validate({
          body,
          query,
          headers,
          params,
        })
        .catch((error) => {
          const err = {
            status: 400,
            message: error.message,
          };
          throw err;
        });

      if (user?.slug) {
        this.conn = mongo.connect(user.slug);
        if (LOGGING) {
          this.log = await new LogRepository(this.conn).create({
            route: this.name,
            data: {
              body,
              query,
              params,
              headers,
            },
            level: "info",
            timestamp: new Date(),
            user: {
              _id: user.id,
              name: user.name,
            },
          });
        }
      }

      return await this.handler(
        this.conn,
        {
          ...request,
          body,
          query,
          params,
          headers,
          user,
        },
        context
      );
    } catch (error) {
      context.error(error);

      if (error.name === "TokenExpiredError") {
        return res.unauthorized("Token expired in " + error.expiredAt);
      }

      if (this.conn && LOGGING) {
        this.log.level = "error";
        this.log.data = {
          ...this.log.data,
          error: {
            message: error.message,
            stack: error.stack,
          },
        };
      }

      // Sentry.captureException(error);
      if (error.status) {
        return res.error(error.status, null, error.message);
      }

      return res.internalServerError();
    } finally {
      if (this.conn) {
        if (LOGGING) {
          this.log.response_at = new Date();
          await this.log.save();
        }
      }
      // await mongo.disconnect(this.conn);
    }
  };

  public configure = (configs: {
    name: string;
    permission?: string;
    options: Omit<HttpFunctionOptions, "handler">;
  }): this => {
    const { name, permission, options } = configs;
    this.name = name;
    this.permission = permission;

    app.http(name, {
      ...options,
      route: options.route ?? name.toLowerCase().replace(/\s/g, "-"),
      handler: this.run,
      authLevel: "anonymous",
    });
    return this;
  };

  public setPublic = (): this => {
    this.isPublic = true;
    return this;
  };

  public setSchemaValidator = (callback: callbackSchema): this => {
    const { body, params, headers } = callback(yup);

    this.schemaValidator = yup.object().shape({
      body: body ?? yup.object().shape({}),
      params: params ?? yup.object().shape({}),
      headers: headers ?? yup.object().shape({}),
      query: yup.object().shape({}),
    });

    return this;
  };
}
