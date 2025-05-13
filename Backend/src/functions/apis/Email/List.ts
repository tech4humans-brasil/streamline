import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import EmailRepository from "../../../repositories/Email";
import FilterQueryBuilder, { WhereEnum } from "../../../utils/filterQueryBuilder";

interface Query {
  page?: number;
  limit?: number;
  project?: string;
}

const filterQueryBuilder = new FilterQueryBuilder({
  project: { type: WhereEnum.EQUAL, alias: "project" },
});


export const handler: HttpHandler = async (conn, req, context) => {
  const { page = 1, limit = 20, ...filter } = req.query as Query;
  const emailRepository = new EmailRepository(conn);

  const where = filterQueryBuilder.build(filter);

  const emails = await emailRepository.find({
    where,
    skip: (page - 1) * limit,
    limit,
    select: {
      htmlTemplate: 0,
      cssTemplate: 0,
    },
  });

  const total = await emailRepository.count({ where });
  const totalPages = Math.ceil(total / limit);

  return res.success({
    emails,
    pagination: {
      page: Number(page),
      total,
      totalPages,
      count: emails.length + (page - 1) * limit,
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
    name: "EmailList",
    permission: "email.update",
    options: {
      methods: ["GET"],
      route: "emails",
    },
  });
