import axios from "axios";
import { IActivity } from "../models/client/Activity";

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

interface DiscordMessage {
  content: string;
  embeds: {
    title: string;
    description: string;
    color: number;
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
    content: `Error on client ${client}`,
    embeds: [
      {
        title: `Error on ${name} block`,
        description: `${error.message}`,
        color: 16711680,
        author: {
          name: name,
        },
      },
      {
        title: "Activity",
        description: "",
        fields: [
          {
            name: "ID",
            value: activity ? activity._id.toString() : "Activity not found",
          },
          {
            name: "Name",
            value: activity ? activity.name : "Activity not found",
          },
          {
            name: "Protocol",
            value: activity ? activity.protocol : "Activity not found",
          },
        ],
        color: 16711680,
        author: {
          name: activity ? activity.users.at(-1).name : "User not found",
        },
      },
    ],
    username: "Streamline Bot Error",
  });
};
