import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import Form, { IFormType } from "../../../models/client/Form";

const handler: HttpHandler = async (conn) => {
  const forms = (
    await new Form(conn)
      .model()
      .find({
        type: IFormType.Created,
      })
      .select({
        _id: 1,
        name: 1,
      })
  ).map((w) => ({
    value: w._id,
    label: w.name,
  }));

  return res.success({
    forms,
  });
};

export default new Http(handler).configure({
  name: "ReportsForms",
  options: {
    methods: ["GET"],
    route: "activities/dashboard/forms",
  },
});