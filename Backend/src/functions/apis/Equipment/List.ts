import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import EquipmentRepository from "../../../repositories/Equipment";
import FilterQueryBuilder, { WhereEnum } from "../../../utils/filterQueryBuilder";

interface Query {
  page?: number;
  limit?: number;
  equipmentType?: string;
}

const filterQueryBuilder = new FilterQueryBuilder(
  {
    inventoryNumber: WhereEnum.ILIKE,
    equipmentType: WhereEnum.ILIKE,
  },
)

const handler: HttpHandler = async (conn, req) => {
  const { page = 1, limit = 10, ...filters } = req.query as Query;

  const equipmentRepository = new EquipmentRepository(conn);

  const where = filterQueryBuilder.build(filters);
  
  const equipments = await equipmentRepository.find({
    skip: (page - 1) * limit,
    where,
    limit,
    sort: {
      createdAt: -1,
    }
  });

  const total = await equipmentRepository.count({ where });
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
  