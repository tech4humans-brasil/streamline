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
  answers: Array<{
    _id: string;
    status: IActivityStepStatus;
    user: Omit<IUser, "password">;
    data: IFormDraft | null;
  }>;
  finished: boolean;
};

export type IActivityEvaluations = {
  _id: string;
  activity_workflow_id: string;
  activity_step_id: string;
  form: IForm;
  final_grade: number;
  answers: Array<{
    _id: string;
    status: IActivityStepStatus;
    grade: number | null;
    user: Omit<IUser, "password">;
    data: IFormDraft | null;
  }> | null;
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
  data: object;
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
  evaluations: IActivityEvaluations[];
  workflows: ActivityWorkflow[];
  description: string;
  createdAt: string;
  updatedAt: string;
  finished_at: string;
};

export default IActivity;
