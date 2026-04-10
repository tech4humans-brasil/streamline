import IActivity, {
  IActivityStep,
  IActivityStepStatus,
} from "@interfaces/Activitiy";
import { IStep, NodeTypes } from "@interfaces/WorkflowDraft";
import type { UnifiedTimelineEvent } from "./buildActivityUnifiedTimelineEvents";

function sameId(a: string | undefined, b: string | undefined): boolean {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

/**
 * True when this workflow step likely requires action from the current user
 * (interaction pendente, passo em erro, ou assinatura Clicksign pendente).
 */
export function timelineFlowStepNeedsUserAttention(
  activity: IActivity | null | undefined,
  step: IActivityStep,
  draftStep: IStep | undefined,
  userId: string | undefined
): boolean {
  if (!activity || !userId || !draftStep) return false;

  if (draftStep.type === NodeTypes.Interaction) {
    const interaction = activity.interactions?.find((i) =>
      sameId(i.activity_step_id, step._id)
    );
    if (!interaction) return false;
    const needsMyResponse = interaction.answers.some(
      (a) =>
        sameId(a.user._id, userId) &&
        !a.data &&
        a.status === IActivityStepStatus.idle
    );
    if (needsMyResponse) return true;
  }

  if (step.status === IActivityStepStatus.error) {
    return true;
  }

  if (draftStep.type === NodeTypes.Clicksign) {
    const docGroup = activity.documents?.find((d) =>
      sameId(d.activity_step_id, step._id)
    );
    if (docGroup && !docGroup.finished) {
      for (const doc of docGroup.documents ?? []) {
        const unsignedMe = doc.users?.some(
          (u) => sameId(u.id, userId) && !u.signed
        );
        if (unsignedMe) return true;
      }
    }
  }

  return false;
}

export function unifiedStepEventNeedsAttention(
  activity: IActivity | null | undefined,
  ev: Extract<UnifiedTimelineEvent, { kind: "step" }>,
  userId: string | undefined
): boolean {
  const draft = ev.workflow.workflow_draft.steps.find(
    (s) => s._id === ev.step.step
  );
  return timelineFlowStepNeedsUserAttention(
    activity,
    ev.step,
    draft,
    userId
  );
}
