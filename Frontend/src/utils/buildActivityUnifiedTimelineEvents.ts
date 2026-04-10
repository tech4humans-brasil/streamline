import IActivity, { IActivityStep } from "@interfaces/Activitiy";
import IComment from "@interfaces/Comments";
import { sortKeyForActivityStep } from "./objectIdTimestamp";

export type UnifiedTimelineEvent =
  | {
    kind: "step";
    at: number;
    id: string;
    step: IActivityStep;
    workflow: IActivity["workflows"][0];
  }
  | {
    kind: "comment";
    at: number;
    id: string;
    comment: IComment;
  };

export function buildSortedUnifiedTimelineEvents(
  activity: IActivity | null | undefined,
  comments: IComment[]
): UnifiedTimelineEvent[] {
  const events: UnifiedTimelineEvent[] = [];
  let idx = 0;
  const createdAt = activity?.createdAt;

  activity?.workflows?.forEach((wf) => {
    wf.steps?.forEach((step) => {
      const at = sortKeyForActivityStep(step._id, createdAt, idx++);
      events.push({
        kind: "step",
        at,
        id: step._id,
        step,
        workflow: wf,
      });
    });
  });

  comments.forEach((c) => {
    events.push({
      kind: "comment",
      at: new Date(c.createdAt).getTime(),
      id: c._id,
      comment: c,
    });
  });

  events.sort((a, b) => {
    if (a.at !== b.at) return a.at - b.at;
    if (a.kind !== b.kind) return a.kind === "comment" ? -1 : 1;
    return String(a.id).localeCompare(String(b.id));
  });

  return events;
}
