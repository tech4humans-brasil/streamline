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
