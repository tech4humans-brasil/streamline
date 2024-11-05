import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { ISchedule, ScheduleStatus } from "../../../models/client/Schedule";
import moment from "moment";
import ScheduleRepository from "../../../repositories/Schedule";
import * as cron from "cron-parser";

const handler: HttpHandler = async (conn, req) => {
  const data = req.body as ISchedule;
  const { id } = req.params;

  const scheduleRepository = new ScheduleRepository(conn);

  const schedule = await scheduleRepository.findById({
    id,
  });

  if (!schedule) {
    return res.notFound("Schedule not found");
  }

  const scheduleUpdated = await scheduleRepository.findByIdAndUpdate({
    id,
    data: {
      name: data.name ?? schedule.name,
      project: data.project ?? schedule.project,
      workflow: data.workflow ?? schedule.workflow,
      form: data.form ?? schedule.form,
      start: data.start ? moment(data.start).toDate() : schedule.start,
      end: data.end ? moment(data.end).toDate() : schedule.end,
      advanced: data.advanced ?? schedule.advanced,
      expression: data.expression ?? schedule.expression,
      repeat: data.repeat ?? schedule.repeat,
      active: data.active,
      timezone: data.timezone ?? schedule.timezone,
    },
  });

  if (
    scheduleUpdated.start !== schedule.start ||
    scheduleUpdated.end !== schedule.end ||
    scheduleUpdated.expression !== schedule.expression
  ) {
    scheduleUpdated.scheduled.forEach((scheduled) => {
      if (scheduled.finished) {
        return;
      }
      scheduled.finished = true;
      scheduled.status = ScheduleStatus.CANCELED;
    });
    if (scheduleUpdated.active) {
      await scheduleRepository.schedule(scheduleUpdated);
    }
  }

  if(scheduleUpdated.scheduled.length > 10) {
    //@ts-ignore
    scheduleUpdated.scheduled = scheduleUpdated.scheduled.slice(-10);
  }

  await scheduleUpdated.save();

  return res.created(scheduleUpdated);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      name: schema.string().required().min(3).max(255),
      project: schema.string().required().min(3).max(255),
      workflow: schema.string().required().min(3).max(255),
      form: schema.string().required().min(3).max(255),
      start: schema.date().required(),
      end: schema.date().optional().nullable(),
      expression: schema
        .string()
        .test("is-valid-cron", "Invalid cron expression", (value) => {
          try {
            cron.parseExpression(value);
            return true;
          } catch (e) {
            return false;
          }
        }),
      repeat: schema.number(),
      active: schema.boolean().optional().default(true),
    }),
    params: schema.object().shape({
      id: schema.string().required().min(3).max(255),
    }),
  }))
  .configure({
    name: "ScheduleUpdate",
    permission: "schedule.update",
    options: {
      methods: ["PUT"],
      route: "schedules/{id}",
    },
  });
