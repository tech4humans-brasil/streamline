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
import { authenticate } from "../services/authenticate";
import { buildSession } from "../services/session";
import mongo from "../services/mongo";
import { Connection } from "mongoose";
import { IInstitute } from "../models/client/Institute";
import { Permissions } from "../services/permissions";
import { IUserRoles } from "../models/client/User";
import LogRepository from "../repositories/Log";
import { ILog } from "../models/client/Log";
import { FileUploaded } from "../services/upload";

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
  photo_url: FileUploaded;
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

// Header que carrega o acronym do tenant nas requisições autenticadas por
// Keycloak. O token não traz tenant, e não deve: a mesma identidade pode ter
// registro em mais de um cliente, com papéis diferentes.
export const TENANT_HEADER = "x-tenant";

export default class Http {
  private handler: HttpHandler;
  private isPublic: boolean = false;
  private authenticatedOnly: boolean = false;
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
      let body: Record<string, unknown> = {};
      if (hasBody.includes(request.method)) {
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          body = {};
        }
      }
      const query = Object.fromEntries(request.query.entries());
      const headers = Object.fromEntries(request.headers.entries());
      const params = request.params;
      let user: User = null;

      if (!this.isPublic) {
        const auth = await authenticate(headers);

        if (auth.kind === "legacy") {
          user = auth.payload as unknown as User;
        } else {
          // O token do Keycloak traz identidade, não domínio. Os campos por
          // tenant (matriculation, institutes, slug, photo_url, permissions)
          // vêm do banco do cliente, e o tenant vem do header porque a mesma
          // pessoa pode ter registro em mais de um.
          user = (await buildSession(auth.identity, headers[TENANT_HEADER], {
            log: (message) => context.log(message),
          })) as unknown as User;
        }

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
      // `this.log` só existe se a criação do registro chegou a acontecer. Um
      // erro anterior a isso deixava o finally estourar e mascarar a exceção
      // original, trocando a resposta de erro por falha da function.
      if (this.conn && LOGGING && this.log) {
        this.log.response_at = new Date();
        await this.log.save().catch((error) => {
          console.error("[http] failed to persist log", error);
        });
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

    // Fail-closed no registro, não no request: endpoint novo que esqueça de
    // declarar autorização derruba o boot, em vez de subir liberado e ninguém
    // perceber. As três saídas são explícitas — permission, público ou
    // autenticado sem permission.
    if (!permission && !this.isPublic && !this.authenticatedOnly) {
      throw new Error(
        `${name}: declare permission, setPublic() ou setAuthenticatedOnly()`
      );
    }

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

  // Declara que o endpoint exige sessão válida mas nenhuma permission
  // específica. Existe para que "sem permission" seja sempre uma decisão
  // escrita, e nunca esquecimento: o `configure` recusa endpoint que não
  // declarou nada.
  public setAuthenticatedOnly = (): this => {
    this.authenticatedOnly = true;
    return this;
  };

  public setSchemaValidator = (callback: callbackSchema): this => {
    const { body, params, headers, query } = callback(yup);

    this.schemaValidator = yup.object().shape({
      body: body ?? yup.object().shape({}),
      params: params ?? yup.object().shape({}),
      headers: headers ?? yup.object().shape({}),
      query: query ?? yup.object().shape({}),
    });

    return this;
  };
}
