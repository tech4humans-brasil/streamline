import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { ClickSignService } from "../../../services/clicksign";

const handler: HttpHandler = async (conn, req) => {
  const clicksignService = new ClickSignService(process.env.CLICKSIGN_API_KEY);

  try {
    return res.success({
      message: "Webhook received",
    });
  } catch (err) {
    return res.error(err.status, null, err.message);
  }
};

export default new Http(handler).configure({
  name: "ClicksignWebhookEvents",
  options: {
    methods: ["GET"],
    route: "clicksign/webhook",
  },
});
