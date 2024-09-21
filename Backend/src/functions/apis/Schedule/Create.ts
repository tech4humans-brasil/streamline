import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { ISchedule } from "../../../models/client/Schedule";
import moment from "moment";
import ScheduleRepository from "../../../repositories/Schedule";
import * as cron from "cron-parser";

const handler: HttpHandler = async (conn, req) => {
  const data = req.body as ISchedule;

  const scheduleRepository = new ScheduleRepository(conn);

  const schedule = await scheduleRepository.create({
    ...data,
    start: moment(data.start).toDate(),
    end: data.end ? moment(data.end).toDate() : null,
  });

  await scheduleRepository.schedule(schedule);

  await schedule.save();

  return res.created(schedule);
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
      timezone: schema.mixed().oneOf(Intl.supportedValuesOf("timeZone")),
      expression: schema.string().test("is-valid-cron", "Invalid cron expression", (value) => {
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
  }))
  .configure({
    name: "ScheduleCreate",
    permission: "schedule.create",
    options: {
      methods: ["POST"],
      route: "schedules",
    },
  });
