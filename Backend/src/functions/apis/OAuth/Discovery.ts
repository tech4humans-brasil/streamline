import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import oidc from "../../../services/oidc";

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const metadata = oidc.getDiscoveryMetadata();

    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=3600", // Cache for 1 hour
      },
      body: JSON.stringify(metadata, null, 2),
    };
  } catch (error) {
    context.error("OIDC Discovery error:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "server_error" }),
    };
  }
}

app.http("OIDCDiscovery", {
  methods: ["GET"],
  route: ".well-known/openid-configuration",
  handler,
  authLevel: "anonymous",
});

export default handler;
