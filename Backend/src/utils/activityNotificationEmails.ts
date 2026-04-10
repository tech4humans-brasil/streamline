import { IUserChild } from "../models/client/Activity";
import { sendEmail } from "../services/email";
import emailTemplate from "./emailTemplate";

function uniqueStakeholderEmails(
  ...groups: Array<IUserChild | null | undefined>
): string[] {
  const set = new Set<string>();
  for (const user of groups) {
    if (user?.email) {
      set.add(user.email);
    }
  }
  return [...set];
}

/**
 * Destinatários para mudança de status manual: participantes + responsável atual.
 */
export function emailsForStatusChangeNotification(
  users: IUserChild[],
  assignee?: IUserChild | null
): string[] {
  return uniqueStakeholderEmails(...users, assignee);
}

/**
 * Destinatários para mudança de atribuição: participantes + novo e antigo responsável.
 */
export function emailsForAssignmentNotification(
  users: IUserChild[],
  newAssignee: IUserChild | null,
  previousAssignee: IUserChild | null | undefined
): string[] {
  return uniqueStakeholderEmails(...users, newAssignee, previousAssignee);
}

export async function sendActivityStatusChangeEmail(params: {
  slug: string;
  activityId: string;
  protocol: string;
  activityName: string;
  previousStatusName?: string;
  newStatusName: string;
  recipients: string[];
  /** Primeiro participante, para saudação alinhada à fila WorkChangeStatus */
  primaryUserName?: string;
}): Promise<void> {
  const {
    slug,
    activityId,
    protocol,
    activityName,
    previousStatusName,
    newStatusName,
    recipients,
    primaryUserName,
  } = params;

  if (recipients.length === 0) {
    return;
  }

  const greeting =
    primaryUserName != null && primaryUserName !== ""
      ? `<p>Olá, ${primaryUserName}!</p>`
      : `<p>Olá!</p>`;

  const previousParagraph =
    previousStatusName != null && previousStatusName !== ""
      ? `<p>Anteriormente, o status era "${previousStatusName}".</p>`
      : "";

  const content = `
    ${greeting}
    <p>A atividade "${activityName}" mudou de status para "${newStatusName}".</p>
    ${previousParagraph}
    <p>Para mais informações, acesse o sistema.</p>
    <a href="${process.env.FRONTEND_URL}/portal/activity/${activityId}">Acessar o painel</a>
`;

  const { html, css } = await emailTemplate({
    content,
    slug,
  });

  await sendEmail(
    recipients,
    `[${protocol}] - Sua atividade mudou de status!`,
    html,
    css
  );
}

export async function sendActivityAssignmentEmail(params: {
  slug: string;
  activityId: string;
  protocol: string;
  activityName: string;
  summaryLine: string;
  recipients: string[];
}): Promise<void> {
  const { slug, activityId, protocol, activityName, summaryLine, recipients } =
    params;

  if (recipients.length === 0) {
    return;
  }

  const content = `
    <p>Olá!</p>
    <p>${summaryLine}.</p>
    <p>Ticket: "${activityName}" (protocolo ${protocol}).</p>
    <p>Para mais informações, acesse o sistema.</p>
    <a href="${process.env.FRONTEND_URL}/portal/activity/${activityId}">Acessar o painel</a>
`;

  const { html, css } = await emailTemplate({
    content,
    slug,
  });

  await sendEmail(
    recipients,
    `[${protocol}] - Atribuição do ticket atualizada`,
    html,
    css
  );
}
