import {
  app,
  InvocationContext,
  ServiceBusQueueFunctionOptions,
} from "@azure/functions";
import { Connection } from "mongoose";
import mongo from "../services/mongo";
import * as yup from "yup";
import Activity, { IActivityStepStatus } from "../models/client/Activity";
import sbusOutputs from "../utils/sbusOutputs";
import { NodeTypes } from "../models/client/WorkflowDraft";
import { sendDiscordBlockError } from "../services/discord";

const IS_IDLE_BLOCK = [NodeTypes.Interaction, NodeTypes.WebRequest];

export interface GenericMessage {
  activity_id: string;
  activity_workflow_id: string;
  activity_step_id: string;
  client: string;
}

type AzureFunctionHandler<TMessage extends GenericMessage> = (
  message: TMessage,
  context: InvocationContext
) => Promise<void>;

type callbackSchema = (schema: typeof yup) => {
  message?: yup.ObjectSchema<yup.AnyObject>;
};

export type QueueWrapperHandler<TMessage extends GenericMessage> = (
  conn: Connection,
  ...args: Parameters<AzureFunctionHandler<TMessage & GenericMessage>>
) => Promise<void>;

export default class QueueWrapper<TMessage> {
  private handler: QueueWrapperHandler<TMessage & GenericMessage>;
  private schemaValidator = yup.object().shape({
    message: yup.object().shape({
      activity_step_id: yup.string().required(),
      activity_id: yup.string().required(),
      activity_workflow_id: yup.string().required(),
    }),
  });
  private name: NodeTypes | "interaction_process" | "evaluation_process";

  constructor(handler: typeof QueueWrapper.prototype.handler) {
    this.handler = handler;
  }

  public setSchemaValidator = (callback: callbackSchema): this => {
    const { message } = callback(yup);

    this.schemaValidator = yup.object().shape({
      message:
        message ??
        yup.object().shape({ activity_step_id: yup.string().required() }),
    });

    return this;
  };

  private run: AzureFunctionHandler<TMessage & GenericMessage> = async (
    message,
    context
  ) => {
    let conn: Connection;

    try {
      conn = mongo.connect(message.client);
      await new Activity(conn)
        .model()
        .findById(message.activity_id)
        .then((activity) => {
          const activityWorkflowIndex = activity.workflows.findIndex(
            (workflow) =>
              workflow._id.toString() === message.activity_workflow_id
          );

          const activityStepIndex = activity.workflows[
            activityWorkflowIndex
          ].steps.findIndex(
            (step) => step._id.toString() === message.activity_step_id
          );

          console.log(
            "activityStepIndex",
            activityStepIndex,
            activityWorkflowIndex
          );

          activity.workflows[activityWorkflowIndex].steps[
            activityStepIndex
          ].status = IActivityStepStatus.inProgress;

          return activity.save();
        });

      await this.schemaValidator
        .validate({
          message,
        })
        .catch((error) => {
          const err = {
            status: 400,
            message: error.message,
          };
          throw err;
        });

      await this.handler(conn, message, context).catch((error) => {
        throw error;
      });

      await new Activity(conn)
        .model()
        .findById(message.activity_id)
        .then((activity) => {
          const activityWorkflowIndex = activity.workflows.findIndex(
            (workflow) =>
              workflow._id.toString() === message.activity_workflow_id
          );
          const activityStepIndex = activity.workflows[
            activityWorkflowIndex
          ].steps.findIndex(
            (step) => step._id.toString() === message.activity_step_id
          );

          if (!IS_IDLE_BLOCK.includes(this.name as NodeTypes)) {
            activity.workflows[activityWorkflowIndex].steps[
              activityStepIndex
            ].status = IActivityStepStatus.finished;
          }

          return activity.save();
        });

      return Promise.resolve();
    } catch (error) {
      let activity = null;
      if (conn) {
        activity = await new Activity(conn)
          .model()
          .findById(message.activity_id)
          .then((activity) => {
            const activityWorkflowIndex = activity.workflows.findIndex(
              (workflow) =>
                workflow._id.toString() === message.activity_workflow_id
            );
            const activityStepIndex = activity.workflows[
              activityWorkflowIndex
            ].steps.findIndex(
              (step) => step._id.toString() === message.activity_step_id
            );

            activity.workflows[activityWorkflowIndex].steps[
              activityStepIndex
            ].status = IActivityStepStatus.error;

            return activity.save();
          });
      }

      sendDiscordBlockError({
        error,
        name: this.name,
        activity,
        client: message.client,
      });

      return Promise.reject(error);
    }
  };

  public configure = (configs: {
    name: string;
    options: Omit<
      ServiceBusQueueFunctionOptions,
      "connection" | "handler" | "extraOutputs" | "queueName"
    > & {
      queueName: NodeTypes | "interaction_process" | "evaluation_process";
    };
  }): this => {
    const { name, options } = configs;
    this.name = options.queueName;
    app.serviceBusQueue(name, {
      ...options,
      connection: "AZURE_SERVICE_BUS_CONNECTION_STRING",
      handler: this.run,
      extraOutputs: sbusOutputs,
    });
    return this;
  };
}
