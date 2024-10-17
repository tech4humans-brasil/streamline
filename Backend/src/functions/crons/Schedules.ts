import CronWrapper, { CronWrapperHandler } from "../../middlewares/cron";
import FormRepository from "../../repositories/Form";
import FormDraftRepository from "../../repositories/FormDraft";
import ScheduleRepository from "../../repositories/Schedule";
import moment from "moment";
import UserRepository from "../../repositories/User";
import WorkflowRepository from "../../repositories/Workflow";
import ActivityRepository from "../../repositories/Activity";
import WorkflowDraftRepository from "../../repositories/WorkflowDraft";
import { IFormType } from "../../models/client/Form";
import BlobUploader from "../../services/upload";
import ResponseUseCases from "../../use-cases/Response";
import StatusRepository from "../../repositories/Status";
import { IActivityStepStatus } from "../../models/client/Activity";
import sendNextQueue from "../../utils/sendNextQueue";
import sbusOutputs from "../../utils/sbusOutputs";
import { ScheduleStatus } from "../../models/client/Schedule";

const handler: CronWrapperHandler = async (conn, myTimer, context) => {
  try {
    const scheduleRepository = new ScheduleRepository(conn);

    const schedules = await scheduleRepository.find({
      where: {
        active: true,
        scheduled: {
          $elemMatch: {
            scheduled: {
              $lte: Date.now(),
            },
            finished: false,
          },
        },
      },
    });

    console.log(`Found ${schedules.length} schedules to process ${conn.name}`);

    if (schedules.length === 0) {
      return;
    }

    const formRepository = new FormRepository(conn);
    const formDraftRepository = new FormDraftRepository(conn);
    const userRepository = new UserRepository(conn);
    const statusRepository = new StatusRepository(conn);
    const activityRepository = new ActivityRepository(conn);
    const workflowRepository = new WorkflowRepository(conn);
    const workflowDraftRepository = new WorkflowDraftRepository(conn);

    for (const schedule of schedules) {
      const scheduledId = schedule.scheduled.find(
        (s) => moment(s.scheduled).isSameOrBefore(Date.now()) && !s.finished
      )?._id;

      if (!scheduledId) {
        continue;
      }

      const scheduled = schedule.scheduled.id(scheduledId);

      console.log(`Processing schedule ${schedule._id} ${conn.name}`);

      try {
        const form = (
          await formRepository.findOpenForms({
            where: {
              _id: schedule.form,
              type: IFormType.TimeTrigger,
            },
          })
        )[0];

        if (!form) {
          console.log(`Form ${schedule.form} not found ${conn.name}`);
          continue;
        }

        const [workflow, formDraft] = await Promise.all([
          workflowRepository.findById({ id: schedule.workflow }),
          formDraftRepository.findById({ id: form.published }),
        ]);

        if (!workflow) {
          console.log(`Workflow ${schedule.workflow} not found ${conn.name}`);
          continue;
        }

        if (!formDraft) {
          console.log(`Form draft ${form.published} not found ${conn.name}`);
          continue;
        }

        const responseUseCases = new ResponseUseCases(
          formDraft,
          new BlobUploader("system"),
          userRepository
        );

        await responseUseCases.processFormFields({
          description: `Ticket gerado automaticamente pelo sistema para o formulário ${form.name}`,
        });

        const status = await statusRepository.findById({
          id: form.initial_status,
        });

        const user = await userRepository.findById({
          id: formDraft.owner,
          select: {
            _id: 1,
            name: 1,
            email: 1,
            matriculation: 1,
            institute: 1,
          },
        });

        if (!status) {
          console.log(`Status ${form.initial_status} not found ${conn.name}`);
          continue;
        }

        const activity = await activityRepository.create({
          name: form.name,
          description: `Ticket gerado automaticamente pelo sistema para o formulário ${form.name}`,
          form: String(form._id),
          status: status.toObject(),
          users: [user.toObject()],
          form_draft: formDraft.toObject(),
          automatic: true,
        });

        const workflowDraft = await workflowDraftRepository.findById({
          id: workflow.published,
          select: { steps: 1 },
        });

        const firstStep = workflowDraft.steps.find(
          (step) => step.id === "start"
        );

        if (!firstStep) {
          console.log(`First step not found ${conn.name}`);
          continue;
        }

        activity.workflows.push({
          workflow_draft: workflowDraft,
          steps: [
            {
              step: firstStep._id,
              status: IActivityStepStatus.inProgress,
            },
          ],
        });

        await activity.save();
        scheduled.activity = activity._id;

        console.log(
          `Finished processing schedule ${schedule._id} ${conn.name}`
        );

        await sendNextQueue({
          conn,
          context,
          activity,
        }).catch((error) => {
          console.error("Error sending to queue", error);
          throw new Error(error);
        });
        activity.workflows[0].steps[0].status = IActivityStepStatus.finished;

        scheduled.status = ScheduleStatus.COMPLETED;
        scheduled.finished = true;

        await scheduleRepository.schedule(schedule);

        await activity.save();
      } catch (err) {
        scheduled.finished = true;
        scheduled.status = ScheduleStatus.FAILED;
        await schedule.save();

        throw err;
      }
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default new CronWrapper(handler).configure({
  name: "CronSchedule",
  options: {
    schedule: "*/15 * * * *",
    retry: {
      maxRetryCount: 3,
      strategy: "exponentialBackoff",
      maximumInterval: 2000,
      minimumInterval: 100,
    },
    extraOutputs: sbusOutputs,
  },
});
