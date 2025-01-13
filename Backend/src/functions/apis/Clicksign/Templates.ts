import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { ClickSignService } from "../../../services/clicksign";

const handler: HttpHandler = async () => {
  const clicksignService = new ClickSignService(process.env.CLICKSIGN_API_KEY);

  const templates = await clicksignService.listTemplates();

  return res.success(templates);
};

export default new Http(handler).configure({
  name: "ClicksignTemplatesList",
  options: {
    methods: ["GET"],
    route: "clicksign/templates",
  },
});
