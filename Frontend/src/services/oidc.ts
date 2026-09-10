import { UserManager, WebStorageStateStore, User } from "oidc-client-ts";

const ISSUER = import.meta.env.VITE_KEYCLOAK_ISSUER ?? "";
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "";
const IDP_HINT = import.meta.env.VITE_KEYCLOAK_IDP_HINT ?? "";

export const CALLBACK_PATH = "/auth/callback";
const TENANT_KEY = "oidc:tenant";
const REDIRECT_KEY = "oidc:redirect";

export const isEnabled = () => Boolean(ISSUER && CLIENT_ID);

let manager: UserManager | null = null;

export const getManager = (): UserManager => {
  if (!isEnabled()) {
    throw new Error(
      "VITE_KEYCLOAK_ISSUER and VITE_KEYCLOAK_CLIENT_ID are required"
    );
  }

  if (!manager) {
    manager = new UserManager({
      authority: ISSUER,
      client_id: CLIENT_ID,
      redirect_uri: `${window.location.origin}${CALLBACK_PATH}`,
      post_logout_redirect_uri: window.location.origin,
      response_type: "code",
      scope: "openid profile email",
      // O access token do realm vive 5 minutos. A renovação é por refresh
      // token, não por iframe: iframe depende de cookie de terceiro e o
      // navegador bloqueia, o que derrubaria a sessão a cada 5 minutos.
      automaticSilentRenew: true,
      // A biblioteca faz PKCE com S256 por padrão no fluxo de code.
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
      stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
    });
  }

  return manager;
};

export const login = async (tenant: string, redirectTo?: string) => {
  // O tenant não vai no token — é o backend que precisa dele, via header
  // x-tenant. Guardado aqui para sobreviver ao redirect do Keycloak.
  sessionStorage.setItem(TENANT_KEY, tenant ?? "");

  if (redirectTo) {
    sessionStorage.setItem(REDIRECT_KEY, redirectTo);
  }

  await getManager().signinRedirect({
    // Mantém o botão "Entrar com Google": o Keycloak pula a própria tela de
    // escolha e vai direto ao IdP federado.
    extraQueryParams: IDP_HINT ? { kc_idp_hint: IDP_HINT } : undefined,
  });
};

export const completeLogin = async (): Promise<User> =>
  // A validação de `state` e a troca do code pelo token são da biblioteca.
  getManager().signinRedirectCallback();

export const getUser = (): Promise<User | null> => getManager().getUser();

let renewal: Promise<User | null> | null = null;

// Renovação única em voo. Sem isso, N requisições que tomam 401 ao mesmo tempo
// disparam N refresh; com rotação de refresh token no Keycloak, as corridas
// perdedoras usam um token já consumido e derrubam a sessão inteira.
export const renew = (): Promise<User | null> => {
  if (!renewal) {
    renewal = getManager()
      .signinSilent()
      .catch((error) => {
        console.error("[oidc] silent renew failed", error);
        return null;
      })
      .finally(() => {
        renewal = null;
      });
  }

  return renewal;
};

export const logout = async () => {
  const user = await getUser().catch(() => null);
  clearTenant();
  await getManager().signoutRedirect({
    id_token_hint: user?.id_token,
  });
};

export const getTenant = () => sessionStorage.getItem(TENANT_KEY) ?? "";

export const clearTenant = () => {
  sessionStorage.removeItem(TENANT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
};

export const takeRedirect = () => {
  const target = sessionStorage.getItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  return target;
};

export default { isEnabled, login, completeLogin, getUser, logout, getTenant };
