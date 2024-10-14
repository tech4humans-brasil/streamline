export enum IFormType {
  Created = "created",
  Interaction = "interaction",
  TimeTrigger = "time-trigger",
  External = "external",
}

type IForm = {
  _id: string;
  name: string;
  slug: string;
  active: boolean;
  type: "created" | "interaction" | "time-trigger" | "external";
  period: { open?: string | null; close?: string | null };
  description: string;
  url: string | null;
  published: boolean;
  institute: [string] | null;
  visibilities: [string] | null;
} & (
  | {
      type: "created";
      initial_status: string;
      workflow: string;
    }
  | {
      type: "interaction";
    }
);

export default IForm;
