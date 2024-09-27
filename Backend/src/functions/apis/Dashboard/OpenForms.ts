import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import FormRepository from "../../../repositories/Form";
import { IForm, IFormType } from "../../../models/client/Form";
import InstituteRepository from "../../../repositories/Institute";

interface IOpenForm {
  institute: {
    _id: string;
    name: string;
    acronym: string;
  } | null;
  forms: Pick<
    IForm,
    "_id" | "name" | "slug" | "description" | "period" | "published"
  >[];
}

const handler: HttpHandler = async (conn, req) => {
  const formRepository = new FormRepository(conn);
  const instituteRepository = new InstituteRepository(conn);

  const forms = await formRepository.findOpenForms({
    where: {
      type: IFormType.Created,
      $and: [
        {
          $or: [
            {
              institute: {
                $in: [req.user.institute._id],
              },
            },
            {
              institute: {
                $eq: null,
              },
            },
          ],
        },
      ],
    },
    select: {
      name: 1,
      slug: 1,
      description: 1,
      period: 1,
      published: 1,
      institute: 1,
      visibilities: 1,
    },
  });

  const instituteIds = forms.flatMap((form) => form.visibilities);

  if (!forms) {
    return res.notFound("Form not found");
  }

  const institutes = await instituteRepository.find({
    where: {
      _id: {
        $in: instituteIds,
      },
    },
    select: {
      name: 1,
      slug: 1,
    },
  });

  const openForms: IOpenForm[] = institutes.map((institute) => {
    return {
      institute,
      forms: forms
        .filter((form) => form.visibilities.includes(institute._id))
        .map((form) => form),
    };
  });

  const noVisibility = forms
    .filter((form) => !form.visibilities)
    .map((form) => form);

  if (noVisibility.length) {
    openForms.push({
      institute: null,
      forms: noVisibility,
    });
  }

  return res.success(openForms);
};

export default new Http(handler).configure({
  name: "DashboardOpenForms",
  permission: "activity.create",
  options: {
    methods: ["GET"],
    route: "dashboard/open-forms",
  },
});
