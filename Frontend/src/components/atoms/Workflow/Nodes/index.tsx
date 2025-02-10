import ChangeStatus from "./ChangeStatus";
import CircleNode from "./Circle";
import Interaction from "./Interaction";
import SendEmail from "./SendEmail";
import SwapWorkflow from "./SwapWorkflow";
import Conditional from "./Conditional";
import WebRequest from "./WebRequest";
import Script from "./Script";
import NewTicket from "./NewTicket";
import Clicksign from "./Clicksign";

export default {
  circle: CircleNode,
  send_email: SendEmail,
  change_status: ChangeStatus,
  swap_workflow: SwapWorkflow,
  interaction: Interaction,
  conditional: Conditional,
  web_request: WebRequest,
  script: Script,
  new_ticket: NewTicket,
  clicksign: Clicksign,
};
