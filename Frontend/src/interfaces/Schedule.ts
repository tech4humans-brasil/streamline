export type IScheduled = {
  _id: string;
  activity: string;
  scheduled: Date;
  finished: boolean;
  status: ScheduleStatus;
  retries?: number;
  active: boolean;
  createdAt: string;
};

export type ISchedule = {
  _id: string;
  name: string;
  project: string;
  workflow: string;
  form: string;
  start: Date | string;
  end: Date | null | string;
  expression: string;
  repeat: number | null;
  active: boolean;
  scheduled: Array<IScheduled>;
};

export enum ScheduleStatus {
  PENDING = "pending",
  STARTED = "started",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELED = "canceled",
}
