import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ScheduleRepository from "../../../repositories/Schedule";
import { DateTime } from "luxon";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params as { id: string };

  const scheduleRepository = new ScheduleRepository(conn);

  const schedule = await scheduleRepository.findById({ id });

  if (!schedule) {
    return res.notFound("Schedule not found");
  }

  return res.success({
    ...schedule.toObject(),
    start: DateTime.fromISO(schedule.start.toISOString(), { zone: "utc" })
      .setZone(schedule.timezone)
      .toISO(),
    end: schedule.end
      ? DateTime.fromISO(schedule.end.toISOString(), { zone: "utc" })
          .setZone(schedule.timezone)
          .toISO()
      : null,
  });
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "ScheduleShow",
    permission: "schedule.read",
    options: {
      methods: ["GET"],
      route: "schedules/{id}",
    },
  });
