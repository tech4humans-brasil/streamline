import { ServiceBusClient } from "@azure/service-bus";
import { InvocationContext, output } from "@azure/functions";
import { GenericMessage } from "../middlewares/queue";

export const extraOutputsSwapWorkflow = output.serviceBusQueue({
  queueName: "swap_workflow",
  connection: "AZURE_SERVICE_BUS_CONNECTION_STRING",
});

const extraOutputsInteraction = output.serviceBusQueue({
  queueName: "interaction",
  connection: "AZURE_SERVICE_BUS_CONNECTION_STRING",
});

const extraOutputsSendEmail = output.serviceBusQueue({
  queueName: "send_email",
  connection: "AZURE_SERVICE_BUS_CONNECTION_STRING",
});

const extraOutputsConditional = output.serviceBusQueue({
  queueName: "conditional",
  connection: "AZURE_SERVICE_BUS_CONNECTION_STRING",
});

const extraOutputsChangeStatus = output.serviceBusQueue({
  queueName: "change_status",
  connection: "AZURE_SERVICE_BUS_CONNECTION_STRING",
});

export const extraOutputsInteractionProcess = output.serviceBusQueue({
  queueName: "interaction_process",
  connection: "AZURE_SERVICE_BUS_CONNECTION_STRING",
});

export const extraOutputsWebRequest = output.serviceBusQueue({
  queueName: "web_request",
  connection: "AZURE_SERVICE_BUS_CONNECTION_STRING",
});

export const extraOutputsScript = output.serviceBusQueue({
  queueName: "script",
  connection: "AZURE_SERVICE_BUS_CONNECTION_STRING",
});

export const extraOutputsNewTicket = output.serviceBusQueue({
  queueName: "new_ticket",
  connection: "AZURE_SERVICE_BUS_CONNECTION_STRING",
});

export const extraOutputsClicksign = output.serviceBusQueue({
  queueName: "clicksign",
  connection: "AZURE_SERVICE_BUS_CONNECTION_STRING",
});

export const extraOutputsDelay = output.serviceBusQueue({
  queueName: "delay",
  connection: "AZURE_SERVICE_BUS_CONNECTION_STRING",
});

const extraOutputs = {
  swap_workflow: extraOutputsSwapWorkflow,
  send_email: extraOutputsSendEmail,
  interaction: extraOutputsInteraction,
  conditional: extraOutputsConditional,
  change_status: extraOutputsChangeStatus,
  interaction_process: extraOutputsInteractionProcess,
  web_request: extraOutputsWebRequest,
  script: extraOutputsScript,
  new_ticket: extraOutputsNewTicket,
  clicksign: extraOutputsClicksign,
  delay: extraOutputsDelay,
};

const sbusOutputs = Object.values(extraOutputs);

export default sbusOutputs;

type SendToQueue = ({
  context,
  queueName,
  message,
}: {
  context: InvocationContext;
  queueName: string;
  message: Object & GenericMessage;
}) => void;

export const sendToQueue: SendToQueue = ({ context, queueName, message }) => {
  console.log("sendToQueue", queueName, message);

  context.extraOutputs.set(extraOutputs[queueName], message);

  context.info(`Sent to queue ${queueName}`);
};

const sbClient = new ServiceBusClient(
  process.env.AZURE_SERVICE_BUS_CONNECTION_STRING
);

export const sendScheduledToQueue = async ({
  queueName,
  message,
  scheduledEnqueueTimeUtc,
}: {
  queueName: string;
  message: object;
  scheduledEnqueueTimeUtc: Date;
}) => {
  const sender = sbClient.createSender(queueName);

  try {
    const sequenceNumbers = await sender.scheduleMessages(
      {
        body: message,
      },
      scheduledEnqueueTimeUtc
    );
    console.log(
      `Message scheduled to queue ${queueName} at ${scheduledEnqueueTimeUtc.toISOString()} with sequence numbers: ${sequenceNumbers}`
    );
  } finally {
    await sender.close();
  }
};
