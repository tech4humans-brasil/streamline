import { Connection } from "mongoose";

const MAX_WORKFLOW_STEPS = 200;
import { sendScheduledToQueue, sendToQueue } from "./sbusOutputs";
import { InvocationContext } from "@azure/functions";
import {
  IActivity,
  IActivityState,
  IActivityStepStatus,
} from "../models/client/Activity";

export default async function sendNextQueue({
  conn,
  activity,
  context,
  path = "default-source",
  delay = 0,
}: {
  conn: Connection;
  activity: IActivity;
  context: InvocationContext;
  path?: "default-source" | "alternative-source";
  delay?: number;
}): Promise<void> {
  try {
    const activityWorkflowIndex = activity.workflows.findIndex(
      (workflow) => !workflow.finished
    );

    const activityWorkflow = activity.workflows[activityWorkflowIndex];

    const actualActivityStep = activityWorkflow.steps.find(
      (step) =>
        step.status === IActivityStepStatus.inProgress ||
        step.status === IActivityStepStatus.idle
    );

    if (!actualActivityStep) {
      throw new Error("Step not found");
    }

    const currentStep = activityWorkflow.workflow_draft.steps.find(
      (step) => step._id.toString() === actualActivityStep.step.toString()
    );

    const nextStep = activityWorkflow.workflow_draft.steps.find(
      (step) => step.id === currentStep.next[path]
    );

    console.log("Next step", nextStep, !!nextStep, delay);

    if (nextStep && activityWorkflow.steps.length >= MAX_WORKFLOW_STEPS) {
      console.error(
        `Limite máximo de ${MAX_WORKFLOW_STEPS} blocos atingido para a atividade ${activity._id.toString()}. Workflow interrompido para evitar loop infinito.`
      );
      for (const exec of activity.workflows) {
        if (exec._id === activityWorkflow._id) {
          exec.finished = true;
        }
      }
      activity.state = IActivityState.finished;
      activity.finished_at = new Date();
      await activity.save();
      return;
    }

    if (nextStep) {
      activity.workflows[activityWorkflowIndex].steps.push({
        step: nextStep._id,
        status: IActivityStepStatus.inQueue,
      });

      const newNextStep = activityWorkflow.steps.at(-1);

      const scheduledEnqueueTimeUtc =
        delay > 0 ? new Date(Date.now() + delay) : undefined;

      console.log("Scheduled enqueue time UTC", scheduledEnqueueTimeUtc);

      if (scheduledEnqueueTimeUtc) {
        await sendScheduledToQueue({
          message: {
            activity_id: activity._id.toString(),
            activity_workflow_id: activityWorkflow._id.toString(),
            activity_step_id: newNextStep._id.toString(),
            client: conn.name,
          },
          queueName: nextStep.type,
          scheduledEnqueueTimeUtc,
        });
      } else {
        sendToQueue({
          context,
          message: {
            activity_id: activity._id.toString(),
            activity_workflow_id: activityWorkflow._id.toString(),
            activity_step_id: newNextStep._id.toString(),
            client: conn.name,
          },
          queueName: nextStep.type,
        });
      }
    } else {
      for (const exec of activity.workflows) {
        if (exec._id === activityWorkflow._id) {
          exec.finished = true;
        }
        activity.state = IActivityState.finished;
        activity.finished_at = new Date();
      }
    }
    await activity.save();
  } catch (error) {
    throw new Error(error);
  }
}
