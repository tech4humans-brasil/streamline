import CronWrapper, { CronWrapperHandler } from "../../middlewares/cron";
import ActivityRepository from "../../repositories/Activity";
import { IActivityStepStatus } from "../../models/client/Activity";
import emailTemplate from "../../utils/emailTemplate";
import { sendEmail } from "../../services/email";

const handler: CronWrapperHandler = async (conn, myTimer, context) => {
  try {
    const activityRepository = new ActivityRepository(conn);

    // Find activities with overdue interactions
    const activities = await activityRepository.find({
      where: {
        interactions: {
          $elemMatch: {
            dueDate: { $lt: new Date() },
            "answers.status": IActivityStepStatus.idle,
          },
        },
      },
      select: {
        _id: 1,
        name: 1,
        interactions: 1,
        users: 1,
      },
    });

    const emailsToNotify = new Set<string>();

    for (const activity of activities) {
      let activityModified = false;

      activity.interactions.forEach((interaction) => {
        if (interaction.dueDate && interaction.dueDate < new Date()) {
          interaction.answers.forEach((answer) => {
            if (answer.status === IActivityStepStatus.idle) {
              // Mark the answer as finished since it's overdue
              answer.status = IActivityStepStatus.finished;
              answer.observation = "Prazo expirado automaticamente pelo sistema";
              activityModified = true;

              // Add user to notification list
              emailsToNotify.add(`${answer.user.email}:${answer.user.name}`);
            }
          });

          // Check if all answers are finished to mark interaction as finished
          const allFinished = interaction.answers.every(
            (answer) => answer.status === IActivityStepStatus.finished
          );
          if (allFinished) {
            interaction.finished = true;
          }
        }
      });

      if (activityModified) {
        await activity.save();
      }
    }

    // Send notification emails
    for (const email of emailsToNotify) {
      const [emailAddress, name] = email.split(":");

      const content = `
        <p>Olá, ${name}!</p>
        <p>Uma ou mais atividades que você estava participando tiveram seu prazo expirado.</p>
        <p>As pendências foram automaticamente fechadas no domínio <strong>${conn.name}</strong>.</p>
        <p>Acesse o painel clicando no link abaixo para verificar:</p>
        <a href="${process.env.FRONTEND_URL}">Acessar o painel</a>
      `;

      const { html, css } = await emailTemplate({ content, slug: conn.name });

      sendEmail(
        emailAddress,
        `Streamline | Prazo de atividades expirado`,
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
  name: "CronDueDate",
  options: {
    schedule: "0 */1 * * *", // Run every hour
    retry: {
      maxRetryCount: 3,
      strategy: "exponentialBackoff",
      maximumInterval: 2000,
      minimumInterval: 100,
    },
  },
}); 