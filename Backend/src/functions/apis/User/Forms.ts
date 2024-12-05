import Http, { HttpHandler } from "../../../middlewares/http";
import InstituteRepository from "../../../repositories/Institute";
import res from "../../../utils/apiResponse";

const handler: HttpHandler = async (conn) => {
  const institutes = (
    await new InstituteRepository(conn).find({
      where: {
        active: true,
      },
      select: {
        _id: 1,
        name: 1,
      },
    })
  ).map((institute) => ({
    label: institute.name,
    value: institute._id,
  }));

  const roles = [
    { label: "Admin", value: "admin" },
    { label: "Usuário", value: "student" },
    { label: "Gestor Ativos", value: "equipment" },
  ];

  return res.success({
    institutes,
    roles,
  });
};

export default new Http(handler).configure({
  name: "UserForms",
  options: {
    methods: ["GET"],
    route: "user/forms",
  },
});
