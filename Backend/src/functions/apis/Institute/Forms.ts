import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";

const handler: HttpHandler = async (conn) => {
  return res.success({});
};

export default new Http(handler).configure({
  name: "InstituteForms",
  permission: "institute.read",
  options: {
    methods: ["GET"],
    route: "institute/forms",
  },
});
