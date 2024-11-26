import Http, { HttpHandler } from "../../../middlewares/http";
import EquipmentRepository from "../../../repositories/Equipment";
import res from "../../../utils/apiResponse";

const handler: HttpHandler = async (conn) => {
  const types = await new EquipmentRepository(conn).distinct({
    field: "equipmentType",
  });

  return res.success({
    types,
  });
};

export default new Http(handler).configure({
  name: "EquipmentForms",
  options: {
    methods: ["GET"],
    route: "equipment/forms",
  },
});
