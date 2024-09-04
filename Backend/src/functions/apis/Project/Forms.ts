import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import UserRepository from "../../../repositories/User";
import InstituteRepository from "../../../repositories/Institute";

const handler: HttpHandler = async (conn, req) => {
  const userReposiory = new UserRepository(conn);
  const instituteRepository = new InstituteRepository(conn);

  const usersPromise = userReposiory.find({
    where: {
      active: true,
      isExternal: false,
    },
    select: {
      name: 1,
      email: 1,
      roles: 1,
    },
  });

  const institutesPromise = instituteRepository.find({
    where: {
      active: true,
    },
    select: {
      name: 1,
      active: 1,
    },
  });

  const [users, institutes] = await Promise.all([
    usersPromise,
    institutesPromise,
  ]);

  const data = [
    {
      label: "Usuários",
      options: users.map((user) => ({
        value: user._id,
        label: user.name,
        type: "user"
      })),
    },
    {
      label: "Grupos",
      options: institutes.map((institute) => ({
        value: institute._id,
        label: institute.name,
        type: "institute"
      })),
    },
  ];

  return res.success(data);
};

export default new Http(handler).configure({
  name: "ProjectForms",
  options: {
    methods: ["GET"],
    route: "project/forms",
  },
});
