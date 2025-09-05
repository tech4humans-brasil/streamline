import { FileUploaded } from "./Answer";
import IComment from "./Comments";
import IForm from "./Form";
import IFormDraft from "./FormDraft";
import IStatus from "./Status";
import IUser from "./User";
import IWorkflowDraft from "./WorkflowDraft";

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

export type IUserChild = Omit<IUser, "password">;

export type IActivityInteractions = {
  _id: string;
  activity_workflow_id: string;
  activity_step_id: string;
  form: IForm;
  canAddParticipants?: boolean;
  permissionAddParticipants?: string[];
  dueDate?: Date | null;
  answers: Array<{
    _id: string;
    status: IActivityStepStatus;
    user: Omit<IUser, "password">;
    observation?: string;
    data: IFormDraft | null;
    responseAt: Date | null;
  }>;
  finished: boolean;
};

export type IActivityDocument = {
  _id: string;
  activity_workflow_id: string;
  activity_step_id: string;
  envelope_id: string;
  documents: Array<{
    id: string;
    name: string;
    closed: boolean;
    file: FileUploaded | null;
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      signed: boolean;
    }>;
  }>;
  finished: boolean;
};

export enum IActivityStepStatus {
  idle = "idle",
  inQueue = "in_queue",
  inProgress = "in_progress",
  finished = "finished",
  error = "error",
}

export type IActivityStep = {
  _id: string;
  step: string;
  status: IActivityStepStatus;
  data: Record<string, string | number | boolean | null>;
};

export type ActivityWorkflow = {
  _id: string;
  workflow_draft: IWorkflowDraft;
  steps: Array<IActivityStep>;
  finished: boolean;
};

export type IActivity = {
  _id: string;
  name: string;
  protocol: string;
  state: IActivityState;
  users: IUserChild[];
  form: IForm;
  form_draft: IFormDraft;
  parent: string;
  status: IStatus;
  due_date: Date | string | null;
  comments: IComment[];
  interactions: IActivityInteractions[];
  documents: IActivityDocument[];
  workflows: ActivityWorkflow[];
  description: string;
  createdAt: string;
  updatedAt: string;
  finished_at: string;
};

export default IActivity;
