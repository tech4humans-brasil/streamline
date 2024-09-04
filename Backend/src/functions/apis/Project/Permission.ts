import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ProjectRepository from "../../../repositories/Project";
import UserRepository from "../../../repositories/User";
import InstituteRepository from "../../../repositories/Institute";
import { IProject } from "../../../models/client/Project";

interface IItem {
  _id: string;
  type: "user" | "institute";
  role: Array<"view" | "update" | "delete">;
  isOwner: boolean;
}

interface IBody {
  permissions: IItem[];
}

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;
  const { permissions: permQuery } = req.body as IBody;

  const users = permQuery.filter((p) => p.type === "user");
  const institutes = permQuery.filter((p) => p.type === "institute");

  const projectRepository = new ProjectRepository(conn);
  const userRepository = new UserRepository(conn);
  const instituteRepository = new InstituteRepository(conn);

  const isProjectExist = await projectRepository.findById({
    id,
    select: { _id: 1 },
  });

  if (!isProjectExist) {
    return res.notFound("Project not found");
  }

  const usersPromises = userRepository.find({
    where: { _id: users.map((user) => user._id) },
    select: {
      _id: 1,
    },
  });

  const institutesPromises = instituteRepository.find({
    where: { _id: institutes.map((institute) => institute._id) },
    select: {
      _id: 1,
    },
  });

  const [usersData, institutesData] = await Promise.all([
    usersPromises,
    institutesPromises,
  ]);

  if (usersData.length !== users.length) {
    return res.badRequest("Some users not found");
  }

  if (institutesData.length !== institutes.length) {
    return res.badRequest("Some institutes not found");
  }

  const userData: IProject["permissions"] = [];

  for (const user of usersData) {
    const u = users.find((u) => u._id === user._id.toString());

    userData.push({
      user: user._id,
      type: "user",
      role: u.role,
      institute: null,
      isOwner: u.isOwner,
    });
  }

  if (userData.length === 1) {
    userData[0].isOwner = true;
  }

  const instituteData: IProject["permissions"] = [];

  for (const institute of institutesData) {
    const i = institutes.find((i) => i._id === institute._id.toString());

    instituteData.push({
      user: null,
      type: "institute",
      role: i.role,
      institute: institute._id,
      isOwner: false,
    });
  }

  const permissions = [...userData, ...instituteData];

  const updateProject = await projectRepository.findByIdAndUpdate({
    id,
    data: { permissions },
  });

  if (!updateProject) {
    return res.notFound("Project not found");
  }

  await updateProject.save();

  return res.success(updateProject);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      users: schema.array(
        schema.object().shape({
          id: schema.string(),
          role: schema.array(
            schema.mixed().oneOf(["view", "update", "delete"])
          ),
        })
      ),
    }),
    params: schema.object().shape({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "projectUpdatePermissions",
    permission: "project.update",
    options: {
      methods: ["PUT"],
      route: "projects/{id}/permissions",
    },
  });
