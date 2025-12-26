
import { HttpHandler } from "../../middlewares/http";
import { IUserRoles } from "../../models/client/User";
import ProjectRepository from "../../repositories/Project";

type User = NonNullable<Parameters<HttpHandler>[1]["user"]>;

const cache = new Map<string, { projects: Array<{ _id: string }>, timestamp: number }>();
const cacheTime = 1000 * 60 * 10; // 10 minutes

export default class PermissionViewProject {
  constructor(private readonly projectRepository: ProjectRepository) { }

  async execute(user: User, where?: any): Promise<Array<{ _id: string }>> {

    const cacheKey = user.id
    const cached = cache.get(cacheKey);
    if (cached && cached.timestamp > Date.now() - cacheTime) {
      return Promise.resolve(cached.projects);
    }

    const whereUser = user.roles.includes(IUserRoles.admin)
      ? {}
      : {
        $and: [
          {
            $or: [
              { "permissions.user": user.id },
              {
                "permissions.institute": {
                  $in: user.institutes.map((institute) => institute._id),
                },
              },
            ],
          },
        ],
      };

    const projects = await this.projectRepository.find({
      where: {
        active: true,
        ...(where || {}),
        ...whereUser,
      },
      select: {
        _id: 1,
      },
    });

    const projectsData = projects.map((project) => ({ _id: project._id.toString() })) || [];

    cache.set(cacheKey, { projects: projectsData, timestamp: Date.now() });

    return projectsData;
  }
}