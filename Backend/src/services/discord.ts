import axios from "axios";
import { IActivity } from "../models/client/Activity";

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

interface DiscordMessage {
  content: string;
  embeds: {
    title: string;
    description: string;
    color: number;
    url?: string;
    fields?: {
      name: string;
      value: string;
    }[];
    author?: {
      name: string;
    };
  }[];
  username: string;
}

const sendDiscordMessage = async (message: DiscordMessage) => {
  if (!webhookUrl) {
    console.log("Discord webhook URL not found");
    return;
  }

  await axios.post(webhookUrl, message).catch((error) => {
    console.error("Error sending discord message", error);
  });
};

export const sendDiscordBlockError = async ({
  error,
  name,
  activity,
  client,
}: {
  error: Error;
  name: string;
  activity: IActivity | null;
  client: string;
}) => {
  return await sendDiscordMessage({
    content: `⚠️ **Error Detected on Client: ${client}**`,
    embeds: [
      {
        title: `🚨 Error in "${name}" Block`,
        description: `An error occurred while processing the system. Below are the details:`,
        color: process.env.NODE_ENV === "production" ? 16711680 : 14745344,
        url: `${process.env.FRONTEND_URL}/portal/activity/${activity?._id}`,
        fields: [
          {
            name: "Environment",
            value: `\`${process.env.NODE_ENV}\``,
          },
          {
            name: "🛑 Error Message",
            value: `\`\`\`diff\n- ${error.message}\n\`\`\``,
          },
          {
            name: "🆔 Activity ID",
            value: activity ? `${activity._id.toString()}` : "`Not Found`",
          },
          {
            name: "📜 Protocol",
            value: activity ? `\`${activity.protocol}\`` : "`Not Found`",
          },
          {
            name: "👤 User",
            value: activity
              ? activity.users?.at(-1)?.name || "`User not identified`"
              : "`Not Found`",
          },
        ],
        author: {
          name: "DevOps Logs",
        },
      },
    ],
    username: "Streamline Bot Error",
  });
};
