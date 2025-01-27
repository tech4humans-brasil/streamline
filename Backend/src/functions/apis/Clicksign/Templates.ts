import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { ClickSignService } from "../../../services/clicksign";
import { connectAdmin } from "../../../services/mongo";
import AdminRepository from "../../../repositories/Admin";

const handler: HttpHandler = async (_, req) => {
  const connAdmin = await connectAdmin();
  const admin = await new AdminRepository(connAdmin).findOne({
    where: {
      acronym: req.user.slug,
    },
  });

  if (!admin || !admin.config?.clicksign?.apiKey) {
    return res.forbidden("Admin not found");
  }

  const clicksignService = new ClickSignService(admin.config.clicksign.apiKey);

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
