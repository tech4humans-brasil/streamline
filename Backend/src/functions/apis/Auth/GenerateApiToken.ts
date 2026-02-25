import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import jwt from "../../../services/jwt";

const API_TOKEN_EXPIRY_DAYS = 90;

export const handler: HttpHandler = async (_, req) => {
  const payload = {
    id: req.user.id,
    name: req.user.name,
    matriculation: req.user.matriculation,
    email: req.user.email,
    roles: req.user.roles,
    institutes: req.user.institutes,
    slug: req.user.slug,
    permissions: req.user.permissions,
    photo_url: req.user.photo_url,
    ...(typeof (req.user as unknown as { client?: string }).client !== "undefined" && {
      client: (req.user as unknown as { client: string }).client,
    }),
    ...(typeof (req.user as unknown as { tutorials?: string[] }).tutorials !== "undefined" && {
      tutorials: (req.user as unknown as { tutorials: string[] }).tutorials,
    }),
  };

  const token = jwt.sign(payload, `${API_TOKEN_EXPIRY_DAYS}d`);

  const expiresAt = new Date(
    Date.now() + API_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  return res.success({
    token,
    expiresAt,
  });
};

export default new Http(handler).configure({
  name: "AuthGenerateApiToken",
  options: {
    methods: ["POST"],
    route: "auth/api-token",
  },
});
