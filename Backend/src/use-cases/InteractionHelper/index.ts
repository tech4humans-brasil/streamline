import { Connection } from "mongoose";
import {
  IActivity,
  IActivityInteractions,
  IActivityStepStatus,
  IUserChild,
} from "../../models/client/Activity";
import { sendToQueue } from "../../utils/sbusOutputs";
import { InvocationContext } from "@azure/functions";
import { IInteraction } from "../../models/client/WorkflowDraft";

class InteractionHelper {
  static processInteractionAnswers(
    interaction: IActivityInteractions,
    activity: IActivity,
    context: InvocationContext,
    conn: Connection
  ) {
    const answeredCount = interaction.answers.filter(
      (answer) => answer.status === IActivityStepStatus.finished
    ).length;

    const shouldProceed = answeredCount >= interaction.waitFor;

    if (shouldProceed && !interaction.canAddParticipants) {
      interaction.finished = true;
      interaction.answers.forEach((answer) => {
        if (answer.status === IActivityStepStatus.idle) {
          answer.status = IActivityStepStatus.finished;
        }
      });

      sendToQueue({
        context,
        message: {
          activity_id: activity._id.toString(),
          activity_workflow_id: interaction.activity_workflow_id.toString(),
          activity_step_id: interaction.activity_step_id.toString(),
          client: conn.name,
        },
        queueName: "interaction_process",
      });
    }
  }

  static calculateWaitFor(length: number, data: IInteraction) {
    const { waitType, waitValue, waitForOne } = data;

    if (waitType === "any") {
      return 1;
    }

    if (waitType === "custom") {
      return waitValue > length ? length : waitValue;
    }

    if (waitType === "all") {
      return length;
    }

    if (waitForOne) {
      return 1;
    }

    return length;
  }
}

export default InteractionHelper;
