import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import {
  applyActivityListVisibility,
  buildActivityVisibilityWhere,
} from "../../../use-cases/ActivityListVisibility";

const handler: HttpHandler = async (conn, req) => {
  const filters: Record<string, string | undefined> = {};
  const visibility = await applyActivityListVisibility(conn, req, filters);

  if (visibility === "empty") {
    return res.success({ names: [] });
  }

  const activityRepository = new ActivityRepository(conn);
  const where = buildActivityVisibilityWhere(filters);

  const raw = await activityRepository.distinct({
    field: "name",
    where,
  });

  const names = (raw as string[])
    .filter((n) => typeof n === "string" && n.trim() !== "")
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return res.success({ names });
};

export default new Http(handler).configure({
  name: "ActivityNames",
  permission: "activity.view",
  options: {
    methods: ["GET"],
    route: "activities/names",
  },
});
