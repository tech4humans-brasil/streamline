import mongoose, { ObjectId, Schema } from "mongoose";

export enum NodeTypes {
  ChangeStatus = "change_status",
  SendEmail = "send_email",
  Circle = "circle",
  SwapWorkflow = "swap_workflow",
  Interaction = "interaction",
  Conditional = "conditional",
  WebRequest = "web_request",
  Script = "script",
  NewTicket = "new_ticket",
  Clicksign = "clicksign",
}

export interface INewTicket {
  name: string;
  form_id: string;
  visible: boolean;
  fields: Record<string, string>;
}

export interface ISendEmail {
  name: string;
  email_id: string;
  sender: string;
  to: string[];
  visible: boolean;
}

export interface IChangeStatus {
  name: string;
  status_id: string;
  visible: boolean;
}

export interface IClicksign {
  name: string;
  visible: false;
  documentKey: string;
  signers: Array<{
    name: string;
    email: string;
  }>;
  fields: Record<string, string>;
}

export interface ICircle {
  name: string;
  visible: false;
}

export interface ISwapWorkflow {
  name: string;
  workflow_id: string;
  visible: false;
}

enum IOperator {
  Eq = "eq",
  Ne = "ne",
  Gt = "gt",
  Lt = "lt",
  Gte = "gte",
  Lte = "lte",
  In = "in",
  NotIn = "notIn",
  IsNull = "isNull",
  IsNotNull = "isNotNull",
}

export interface IInteraction {
  name: string;
  form_id: string;
  to: string[];
  visible: boolean;
  waitForOne?: boolean;
  conditional: [
    {
      field: string;
      value: string;
      operator: IOperator;
    }
  ];
  waitType: "all" | "any" | "custom";
  waitValue: number | null;
}

export interface IScript {
  name: string;
  script: string;
  visible: boolean;
}

export type IConditional = {
  name: string;
  visible: boolean;
  form_id: string;
  conditional: Array<{
    field: string;
    value: string;
    operator: IOperator;
  }>;
  ifNotExists: string | null;
};

export interface IWebRequest {
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers: Array<{
    key: string;
    value: string;
  }>;
  body: string;
  visible: false;
  is_async: boolean;
  field_populate?: [
    {
      key: string;
      value: string;
    }
  ];
}

export type IStep = {
  _id: ObjectId;
  id: string;
  visible: boolean;
  position: { x: number; y: number };
  next: {
    ["default-source"]: string | null;
    ["alternative-source"]: string | null;
  };
} & (
  | {
      type: NodeTypes.SendEmail;
      data: ISendEmail;
    }
  | {
      type: NodeTypes.ChangeStatus;
      data: IChangeStatus;
    }
  | {
      type: NodeTypes.Circle;
      data: ICircle;
    }
  | {
      type: NodeTypes.SwapWorkflow;
      data: ISwapWorkflow;
    }
  | {
      type: NodeTypes.Interaction;
      data: IInteraction;
    }
  | {
      type: NodeTypes.Conditional;
      data: IConditional;
    }
  | {
      type: NodeTypes.WebRequest;
      data: IWebRequest;
    }
  | {
      type: NodeTypes.Script;
      data: IScript;
    }
  | {
      type: NodeTypes.NewTicket;
      data: INewTicket;
    }
  | {
      type: NodeTypes.Clicksign;
      data: IClicksign;
    }
);

export enum IWorkflowDraftStatus {
  Draft = "draft",
  Published = "published",
}

export type IWorkflowDraft = {
  _id: string;
  name: string;
  status: "draft" | "published";
  owner: Schema.Types.ObjectId | string;
  steps: IStep[];
  parent: Schema.Types.ObjectId | string | null;
  viewport: { x: number; y: number; zoom: number };
  createdAt: string;
  updatedAt: string;
  version: number;
} & mongoose.Document;

export const schemaBase = new Schema<IWorkflowDraft>(
  {
    version: { type: Number, default: 1, auto: true },
    status: { type: String, default: "draft", enum: ["draft", "published"] },
    parent: { type: Schema.Types.ObjectId, ref: "Workflow" },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    viewport: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      zoom: { type: Number, default: 1 },
    },
    steps: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
        id: { type: String, required: true },
        type: {
          type: String,
          enum: Object.values(NodeTypes),
        },
        position: {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
        },
        deletable: { type: Boolean },
        data: {
          type: Object,
          required: true,
        },
        next: {
          ["default-source"]: {
            type: String,
            default: null,
          },
          ["alternative-source"]: {
            type: String,
          },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const schema = schemaBase.clone();

schema
  .index({ parent: 1, version: -1 }, { unique: true })
  .index({ version: -1 });

export default class WorkflowDraft {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IWorkflowDraft>("WorkflowDraft", schema);
  }
}
