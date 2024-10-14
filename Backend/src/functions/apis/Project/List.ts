import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { StatusType } from "../../../models/client/Status";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";
import ProjectRepository from "../../../repositories/Project";
import { IUserRoles } from "../../../models/client/User";

interface Query {
  page?: number;
  limit?: number;
  name?: string;
  type?: StatusType;
}

const filterQueryBuilder = new FilterQueryBuilder({
  name: WhereEnum.ILIKE,
  type: WhereEnum.ARRAY,
});

const handler: HttpHandler = async (conn, req, context) => {
  const filter = req.query as Query;

  const projectRepository = new ProjectRepository(conn);

  const where = filterQueryBuilder.build(filter);

  const whereUser = req.user.roles.includes(IUserRoles.admin)
    ? {}
    : {
        $and: [
          {
            $or: [
              { "permissions.user": req.user.id },
              { "permissions.institute": req.user.institute._id },
            ],
          },
        ],
      };

  const projects = await projectRepository.find({
    where: {
      ...where,
      ...whereUser,
    },
    select: {
      _id: 1,
      name: 1,
      description: 1,
      permissions: 1,
    },
  });

  const total = projects.length;
  const page = 1;

  return res.success({
    projects,
    pagination: {
      page: Number(page),
      total,
      totalPages: 1,
      count: projects.length,
    },
  });
};

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
      })
      .optional(),
  }))
  .configure({
    name: "ProjectList",
    permission: "project.read",
    options: {
      methods: ["GET"],
      route: "projects",
    },
  });
