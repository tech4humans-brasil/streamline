import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IEquipment } from "../../../models/client/Equipment";
import EquipmentRepository from "../../../repositories/Equipment";

interface Query {
  page?: number;
  limit?: number;
  type?: string;
}

const handler: HttpHandler = async (conn, req) => {
  const { page = 1, limit = 10, type } = req.query as Query;

  const equipmentRepository = new EquipmentRepository(conn);

  const equipments = await equipmentRepository.find({
    where: {
      equipmentType: type
    },
    skip: (page - 1) * limit,
    limit,
  });

  const total = await equipmentRepository.count({
    where: {
      equipmentType: type
    }
  });
  const totalPages = Math.ceil(total / limit);

  return res.success({
    equipments,
    pagination: {
      page: Number(page),
      total,
      totalPages,
      count: equipments.length + (page - 1) * limit,
    },
  });
}

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    query: schema
      .object({
        page: schema
          .number()
          .optional()
          .transform((v) => Number(v))
          .default(1)
          .min(1),
        limit: schema
          .number()
          .optional()
          .transform((v) => Number(v)), 
        type: schema
          .string()
          .optional(),
      })
      .optional(),
  }))
  .configure({
    name: "EquipmentList",
    permission: "equipment.read",
    options: {
      methods: ["GET"],
      route: "equipments",
    },
  });
  