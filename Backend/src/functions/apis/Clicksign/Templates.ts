import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { ClickSignService } from "../../../services/clicksign";

const handler: HttpHandler = async () => {
  const clicksignService = new ClickSignService(process.env.CLICKSIGN_API_KEY);

  try {
    const response = await clicksignService.listTemplates().catch((err) => {
      console.error(err.message);
      throw res.forbidden("Failed to list templates");
    });

    const templates = response.data.map((template) => ({
      id: template.id,
      name: template.attributes.name,
      created: template.attributes.created,
      modified: template.attributes.modified,
    }));

    return res.success(templates);
  } catch (err) {
    return res.error(err.status, null, err.message);
  }
};

export default new Http(handler).configure({
  name: "ClicksignTemplatesList",
  options: {
    methods: ["GET"],
    route: "clicksign/templates",
  },
});
