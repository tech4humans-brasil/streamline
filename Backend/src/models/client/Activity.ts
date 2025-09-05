import mongoose, { ObjectId, Schema } from "mongoose";
import { IUser } from "./User";
import { IStatus } from "./Status";
import { IFormDraft, schema as schemaFormDraft } from "./FormDraft";
import { IWorkflowDraft } from "./WorkflowDraft";
import { IForm } from "./Form";
import { FileUploaded } from "../../services/upload";

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
  data: Record<string, string | number | boolean | null>;
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
  canAddParticipants?: boolean;
  permissionAddParticipants?: string[];
  dueDate?: Date | null;
  answers: mongoose.Types.DocumentArray<{
    _id: ObjectId;
    status: IActivityStepStatus;
    observation?: string | null;
    user: Omit<IUser, "password">;
    responseAt: Date | null;
    data: IFormDraft | null;
  }>;
  finished: boolean;
};

export type IActivityDocument = {
  _id: ObjectId;
  activity_workflow_id: ObjectId;
  activity_step_id: ObjectId;
  envelope_id: string;
  documents: mongoose.Types.DocumentArray<{
    id: string;
    name: string;
    closed: boolean;
    file: FileUploaded | null;
    users: mongoose.Types.DocumentArray<{
      id: string;
      name: string;
      email: string;
      role: string;
      signed: boolean;
    }>;
  }>;
  finished: boolean;
};

export type IActivity = {
  _id: ObjectId;
  name: string;
  protocol: string;
  state: IActivityState;
  users: IUserChild[];
  parent: mongoose.Types.ObjectId | string;
  form: mongoose.Types.ObjectId | string;
  form_draft: IFormDraft;
  finished_at: Date | null;
  due_date: Date | null;
  automatic: boolean;
  status: IStatus;
  comments: IComment[];
  workflows: mongoose.Types.DocumentArray<ActivityWorkflow>;
  interactions: mongoose.Types.DocumentArray<IActivityInteractions>;
  documents: mongoose.Types.DocumentArray<IActivityDocument>;
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
  canAddParticipants: { type: Boolean, required: false },
  permissionAddParticipants: [{ type: Schema.Types.ObjectId, required: false }],
  dueDate: { type: Date, required: false, default: null },
  answers: [
    {
      _id: { type: Schema.Types.ObjectId, auto: true },
      status: {
        type: String,
        required: true,
        enum: Object.values(IActivityStepStatus),
      },
      observation: { type: String, required: false },
      responseAt: { type: Date, required: false, default: null },
      user: { type: userSchema, required: true },
      data: { type: Object, default: null },
    },
  ],
  finished: { type: Boolean, default: false },
}).index({ "answers.user._id": 1, "answers.status": 1 },
  { unique: false, partialFilterExpression: { "answers.status": IActivityStepStatus.idle }, })
  .index({
    "canAddParticipants": 1,
    "permissionAddParticipants": 1,
    "answers": 1
  }, {
    partialFilterExpression: { canAddParticipants: true },
    sparse: true
  })
  .index({
    "answers.dueDate": 1
  }, {
    unique: false,
    partialFilterExpression: { "answers.dueDate": { $exists: true }, "answers.status": IActivityStepStatus.idle },
  });

const documentSchema = new Schema<IActivityDocument>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  activity_workflow_id: { type: Schema.Types.ObjectId, required: true },
  activity_step_id: { type: Schema.Types.ObjectId, required: true },
  envelope_id: { type: String, required: true },
  documents: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
      closed: { type: Boolean, required: true },
      file: { type: Object, required: false, default: null },
      users: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          email: { type: String, required: true },
          role: { type: String, required: true },
          signed: { type: Boolean, required: false, default: false },
        },
      ],
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
    parent: {
      type: Schema.Types.ObjectId,
      required: false,
      default: null,
      ref: "Activity",
    },
    state: {
      type: String,
      required: true,
      enum: Object.values(IActivityState),
      default: IActivityState.processing,
    },
    due_date: { type: Date, required: false, default: null, index: true },
    users: [{ type: userSchema, required: true }],
    finished_at: { type: Date, required: false, default: null },
    status: { type: statusSchema, required: true },
    interactions: [{ type: interactionSchema, required: false, default: [] }],
    documents: [{ type: documentSchema, required: false, default: [] }],
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
