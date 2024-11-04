import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import FormRepository from "../../../repositories/Form";

const handler: HttpHandler = async (conn, req) => {
  const { slug } = req.params as { slug: string };

  const formRepository = new FormRepository(conn);

  const form = (
    await formRepository.findOpenForms({
      where: {
        slug,
        $and: [
          {
            $or: [
              {
                institute: {
                  $in: req.user.institutes.map((institute) => institute._id),
                },
              },
              {
                institutes: {
                  $eq: [],
                },
              },
            ],
          },
        ],
      },
      populate: [
        {
          path: "published",
        },
      ],
    })
  )[0];

  if (!form) {
    return res.notFound("Form not found");
  }

  return res.success(form);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      slug: schema.string().required(),
    }),
  }))
  .configure({
    name: "FormSlug",
    permission: "response.create",
    options: {
      methods: ["GET"],
      route: "form/slug/{slug}",
    },
  });
