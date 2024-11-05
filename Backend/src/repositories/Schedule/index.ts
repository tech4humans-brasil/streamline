import { Connection } from "mongoose";
import BaseRepository from "../base";
import Schedule, {
  ISchedule,
  ScheduleStatus,
} from "../../models/client/Schedule";
import moment from "moment";
import * as cron from "cron-parser";

export default class ScheduleRepository extends BaseRepository<ISchedule> {
  constructor(connection: Connection) {
    super(new Schedule(connection).model());
  }

  async schedule(schedule: ISchedule) {
    const now = moment().toDate();
    const start = schedule.start > now ? schedule.start : now;

    if (schedule.end && start > schedule.end) {
      schedule.active = false;
      return null;
    }

    if (schedule.repeat) {
      const countRepeatSuccess = schedule.scheduled.filter(
        (s) => s.status === ScheduleStatus.COMPLETED
      ).length;

      if (countRepeatSuccess < schedule.repeat) {
        schedule.active = false;
        return null;
      }
    }

    const expression = cron.parseExpression(schedule.expression, {
      currentDate: start,
      tz: schedule.timezone,
    });

    const next = expression.next().toDate();

    if (schedule.end && next > schedule.end) {
      schedule.active = false;
      return null;
    }

    schedule.scheduled.push({
      scheduled: next,
    });

    await schedule.save();
  }
}
