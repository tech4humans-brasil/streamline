import mongoose, { ObjectId, Schema } from "mongoose";
import { IUser } from "./User";
import { IStatus } from "./Status";
import { IFormDraft, schema as schemaFormDraft } from "./FormDraft";
import { IWorkflowDraft } from "./WorkflowDraft";
import { IForm } from "./Form";

export enum IActivityState {
  finished = "finished",
  processing = "processing",
  committed = "committed",
  created = "created",
}

export enum IActivityStatus {
  active = "active",
  inactive = "inactive",
}

export enum IActivityAccepted {
  accepted = "accepted",
  rejected = "rejected",
  pending = "pending",
}

export type IComment = {
  _id: string | mongoose.Types.ObjectId;
  user: IUserChild;
  content: string;
  viewed: mongoose.Types.ObjectId[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
} & mongoose.Document;

export type IUserChild = Pick<
  IUser,
  "_id" | "name" | "email" | "matriculation" | "institutes" | "isExternal"
>;

export enum IActivityStepStatus {
  idle = "idle",
  inQueue = "in_queue",
  inProgress = "in_progress",
  finished = "finished",
  error = "error",
}

export type IActivityStep = {
  _id: ObjectId;
  step: ObjectId;
  status: IActivityStepStatus;
  data: object;
  interactions: IFormDraft[];
};

export type ActivityWorkflow = {
  _id: ObjectId;
  workflow_draft: IWorkflowDraft;
  steps: mongoose.Types.DocumentArray<IActivityStep>;
  finished: boolean;
};

export type IActivityInteractions = {
  _id: ObjectId;
  activity_workflow_id: ObjectId;
  activity_step_id: ObjectId;
  form: IForm;
  waitFor: number;
  waitForOne?: boolean;
  answers: mongoose.Types.DocumentArray<{
    _id: ObjectId;
    status: IActivityStepStatus;
    user: Omit<IUser, "password">;
    data: IFormDraft | null;
  }>;
  finished: boolean;
};

export type IActivityEvaluations = {
  _id: ObjectId;
  activity_workflow_id: ObjectId;
  activity_step_id: ObjectId;
  form: IForm;
  final_grade: number | null;
  not_defined_board: boolean;
  answers: mongoose.Types.DocumentArray<{
    _id: ObjectId;
    status: IActivityStepStatus;
    user: Omit<IUser, "password">;
    grade: number | null;
    data: IFormDraft | null;
  }> | null;
  finished: boolean;
};

export type IActivity = {
  _id: ObjectId;
  name: string;
  protocol: string;
  state: IActivityState;
  users: IUserChild[];
  form: mongoose.Types.ObjectId | string;
  form_draft: IFormDraft;
  finished_at: Date | null;
  automatic: boolean;
  status: IStatus;
  comments: IComment[];
  workflows: mongoose.Types.DocumentArray<ActivityWorkflow>;
  interactions: mongoose.Types.DocumentArray<IActivityInteractions>;
  evaluations: mongoose.Types.DocumentArray<IActivityEvaluations>;
  description: string;
  createdAt: string;
  updatedAt: string;
} & mongoose.Document;

const userSchema = new Schema<IUserChild>({
  _id: {
    type: Schema.Types.ObjectId,
    required: () => !(this as IUserChild).isExternal,
    index: true,
  },
  isExternal: { type: Boolean, required: false },
  name: { type: String, required: true },
  email: { type: String, required: true },
  matriculation: { type: String },
  institutes: [{ type: Object, required: true }],
});

const interactionSchema = new Schema<IActivityInteractions>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  activity_workflow_id: { type: Schema.Types.ObjectId, required: true },
  activity_step_id: { type: Schema.Types.ObjectId, required: true },
  form: { type: Object, required: true },
  waitFor: { type: Number, default: 1 },
  waitForOne: { type: Boolean, required: false },
  answers: [
    {
      _id: { type: Schema.Types.ObjectId, auto: true },
      status: {
        type: String,
        required: true,
        enum: Object.values(IActivityStepStatus),
      },
      user: { type: userSchema, required: true },
      data: { type: Object, default: null },
    },
  ],
  finished: { type: Boolean, default: false },
}).index({ "answers.user._id": 1, "answers.status": 1 }, { unique: false });

const evaluationsSchema = new Schema<IActivityEvaluations>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  activity_workflow_id: { type: Schema.Types.ObjectId, required: true },
  activity_step_id: { type: Schema.Types.ObjectId, required: true },
  form: { type: Object, required: true },
  final_grade: { type: Number, default: null },
  not_defined_board: { type: Boolean, default: false, index: true },
  answers: [
    {
      _id: { type: Schema.Types.ObjectId, auto: true },
      status: {
        type: String,
        required: true,
        enum: Object.values(IActivityStepStatus),
      },
      grade: { type: Number, default: null },
      user: { type: userSchema, required: true },
      data: { type: Object, default: null },
    },
  ],
  finished: { type: Boolean, default: false },
}).index({ "answers.user._id": 1, "answers.status": 1 }, { unique: false });

const commentSchema = new Schema<IComment>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    user: { type: Object, required: true },
    content: { type: String, required: true },
    viewed: [{ type: Schema.Types.ObjectId }],
    isEdited: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const statusSchema = new Schema<IStatus>({
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ["progress", "done", "canceled"],
  },
});

export const ActivityStepSchema = new Schema<IActivityStep>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  step: { type: Schema.Types.ObjectId, required: true },
  status: {
    type: String,
    required: true,
    enum: Object.values(IActivityStepStatus),
    default: IActivityStepStatus.idle,
  },
  data: { type: Object, required: false, default: {} },
  interactions: [{ type: Object, required: false, default: [] }],
});

export const ActivityWorkflowSchema = new Schema<ActivityWorkflow>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  workflow_draft: {
    type: Object,
    required: true,
  },
  steps: [{ type: ActivityStepSchema, required: false, default: [] }],
  finished: { type: Boolean, default: false },
});

export const schema: Schema = new Schema<IActivity>(
  {
    name: { type: String, required: true },
    automatic: { type: Boolean, required: false, default: false },
    form: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    form_draft: { type: schemaFormDraft, required: true },
    protocol: { type: String, required: false, unique: true },
    description: { type: String, required: true },
    comments: [{ type: commentSchema, required: false, default: [] }],
    state: {
      type: String,
      required: true,
      enum: Object.values(IActivityState),
      default: IActivityState.processing,
    },
    users: [{ type: userSchema, required: true }],
    finished_at: { type: Date, required: false, default: null },
    status: { type: statusSchema, required: true },
    interactions: [{ type: interactionSchema, required: false, default: [] }],
    evaluations: [{ type: evaluationsSchema, required: false, default: [] }],
    workflows: [
      {
        type: ActivityWorkflowSchema,
        required: false,
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
)
  .pre<IActivity>("save", function (next) {
    if (!this.isNew) {
      return next();
    }
    const year = new Date().getFullYear();
    const timestamp = new Date().getTime().toString().slice(-5);
    this.protocol = `${year}${timestamp}`;
    next();
  })
  .index({ createdAt: -1 }, { unique: false });

export default class Activity {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IActivity>("Activity", schema);
  }
}
