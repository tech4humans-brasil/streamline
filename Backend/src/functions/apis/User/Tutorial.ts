import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import UserRepository from "../../../repositories/User";

const handler: HttpHandler = async (conn, req) => {
  // O `{id}` da rota é ignorado de propósito. Antes ele era usado para
  // carregar e salvar o documento, o que deixava qualquer usuário autenticado
  // escrever no array de tutoriais de outra pessoa, bastando passar o _id
  // dela. Tutorial é estado do próprio usuário e sai da sessão.
  const id = req.user.id;
  const { tutorial } = req.query as { tutorial: string };
  const userRepository = new UserRepository(conn);

  const user = await userRepository.findById({
    id,
    select: {
      password: 0,
      __v: 0,
    },
  });

  if (!user) {
    return res.notFound("User not found");
  }

  if (user.tutorials.includes(tutorial)) {
    return res.success(user.tutorials);
  }

  user.tutorials.push(tutorial);

  await user.save();

  return res.success(user.tutorials);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    query: schema.object({
      tutorial: schema.string(),
    }),
  }))
  .setAuthenticatedOnly()
  .configure({
    name: "UserTutorial",
    options: {
      methods: ["GET"],
      route: "user/{id}/tutorial",
    },
  });
