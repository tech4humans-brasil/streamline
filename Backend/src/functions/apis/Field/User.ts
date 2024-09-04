import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import UserRepository from "../../../repositories/User";

const handler: HttpHandler = async (conn, req) => {
  const userReposiory = new UserRepository(conn);

  const users = await userReposiory.find({
    where: {
      active: true,
      isExternal: false,
    },
    select: {
      name: 1,
      email: 1,
      roles: 1,
      active: 1,
      isExternal: 1,
      matriculation: 1,
      institute: 1,
    },
  });

  return res.success(users);
};

export default new Http(handler).configure({
  name: "FieldTeacherList",
  options: {
    methods: ["GET"],
    route: "field/users",
  },
});
