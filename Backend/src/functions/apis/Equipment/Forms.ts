import Http, { HttpHandler } from "../../../middlewares/http";
import {
  IEquipmentSituation,
  IEquipmentStatus,
} from "../../../models/client/Equipment";
import EquipmentRepository from "../../../repositories/Equipment";
import res from "../../../utils/apiResponse";

const handler: HttpHandler = async (conn) => {
  const typesPromise = new EquipmentRepository(conn).distinct({
    field: "equipmentType",
  });

  const brandNamePromise = new EquipmentRepository(conn).distinct({
    field: "brandName",
  });

  const status = Object.values(IEquipmentStatus);

  const situation = Object.values(IEquipmentSituation);

  const [types, brandNames] = await Promise.all([
    typesPromise,
    brandNamePromise,
  ]);

  return res.success({
    types,
    brandNames,
    status,
    situation,
  });
};

export default new Http(handler).configure({
  name: "EquipmentForms",
  options: {
    methods: ["GET"],
    route: "equipment/forms",
  },
});
