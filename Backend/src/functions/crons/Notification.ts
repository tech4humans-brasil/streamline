import CronWrapper, { CronWrapperHandler } from "../../middlewares/cron";
import ActivityRepository from "../../repositories/Activity";
import { IActivityStepStatus } from "../../models/client/Activity";
import emailTemplate from "../../utils/emailTemplate";
import { sendEmail } from "../../services/email";

const handler: CronWrapperHandler = async (conn, myTimer, context) => {
  try {
    const activityRepository = new ActivityRepository(conn);

    const pendingActivities = await activityRepository.find({
      where: {
        finished_at: {
          $eq: null,
        },
        interactions: {
          $elemMatch: {
            "answers.status": IActivityStepStatus.idle,
          },
        },
      },
      select: {
        _id: 1,
        name: 1,
        description: 1,
        protocol: 1,
        users: 1,
        "interactions.form": 1,
        "interactions.answers": 1,
      },
    });

    const emailsToNotified = new Set<string>();

    pendingActivities.forEach((activity) => {
      activity.interactions.forEach((interaction) => {
        interaction.answers.forEach((answer) => {
          if (answer.status === IActivityStepStatus.idle) {
            emailsToNotified.add(`${answer.user.email}:${answer.user.name}`);
          }
        });
      });
    });

    for (const email of emailsToNotified) {
      const [emailAddress, name] = email.split(":");

      const content = `
        <p>Olá, ${name}!</p>
        <p>Você possui atividades pendentes em nosso sistema.</p>
        <p>Verifique o painel para mais informações no domínio <strong>${conn.name}</strong>.</p>
        <p>Acesse o painel clicando no link abaixo:</p>
        <a href="${process.env.FRONTEND_URL}">Acessar o painel</a>
      `;

      const { html, css } = await emailTemplate({ content, slug: conn.name });

      sendEmail(
        emailAddress,
        `Streamline | Atividades pendentes no sistema`,
        html,
        css
      );
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default new CronWrapper(handler).configure({
  name: "CronNotification",
  options: {
    schedule: "0 11,17 * * *",
    retry: {
      maxRetryCount: 1,
      strategy: "exponentialBackoff",
      maximumInterval: 2000,
      minimumInterval: 100,
    },
  },
});
