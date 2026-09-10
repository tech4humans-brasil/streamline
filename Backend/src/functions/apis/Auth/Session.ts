import Http, { HttpHandler, TENANT_HEADER } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { authenticate } from "../../../services/authenticate";
import { buildSession, touchLastLogin } from "../../../services/session";

// Devolve a sessão do Streamline para um access token do Keycloak. O frontend
// chama isso depois do callback OIDC, no lugar de decodificar o token: as
// claims trazem identidade, não os campos de domínio por tenant.
export const handler: HttpHandler = async (_, req) => {
  const auth = await authenticate(req.headers);

  if (auth.kind !== "keycloak") {
    // Token legado já carrega a sessão inteira no payload. O frontend antigo
    // continua decodificando; este endpoint existe para o caminho novo.
    return res.success(auth.payload);
  }

  const session = await buildSession(auth.identity, req.headers[TENANT_HEADER], {
    withPhotoSas: true,
  });

  void touchLastLogin(session.slug, session.id);

  return res.success(session);
};

export default new Http(handler)
  .setPublic()
  .configure({
    name: "AuthSession",
    options: {
      methods: ["GET"],
      route: "auth/session",
    },
  });
