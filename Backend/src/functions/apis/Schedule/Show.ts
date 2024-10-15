import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ScheduleRepository from "../../../repositories/Schedule";
import { DateTime } from "luxon";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params as { id: string };

  const scheduleRepository = new ScheduleRepository(conn);

  const schedule = await scheduleRepository.findById({
    id,
    select: {
      start: 1,
      end: 1,
      timezone: 1,
      name: 1,
      project: 1,
      workflow: 1,
      form: 1,
      advanced: 1,
      expression: 1,
      repeat: 1,
      active: 1,
      scheduled: {
        $slice: -5,
      },
    },
  });

  if (!schedule) {
    return res.notFound("Schedule not found");
  }

  return res.success({
    ...schedule.toObject(),
    scheduled: schedule.scheduled.reverse(),
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
