import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import oidc from "../../../services/oidc";

interface Body {
  clientId: string;
  clientSecret: string;
  name: string;
  description?: string;
  redirectUris: string[];
  scopes?: string[];
}

export const handler: HttpHandler = async (conn, req, context) => {
  const body = req.body as Body;

  try {
    const client = await oidc.registerClient({
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      name: body.name,
      description: body.description,
      redirectUris: body.redirectUris,
      scopes: body.scopes,
    });

    return res.created({
      clientId: client.clientId,
      name: client.name,
      description: client.description,
      redirectUris: client.redirectUris,
      scopes: client.scopes,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.conflict("Client with this ID already exists");
    }
    throw error;
  }
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      clientId: schema.string().required(),
      clientSecret: schema.string().min(16).required(),
      name: schema.string().required(),
      description: schema.string().optional(),
      redirectUris: schema.array().of(schema.string().url()).min(1).required(),
      scopes: schema.array().of(schema.string()).optional(),
    }),
  }))
  .configure({
    name: "OAuthRegisterClient",
    permission: "admin:oidc:clients:create",
    options: {
      methods: ["POST"],
      route: "oauth/clients",
    },
  });
