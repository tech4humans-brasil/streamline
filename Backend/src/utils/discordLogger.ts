import axios from "axios";

interface DiscordLoggerConfig {
  webhookUrl: string;
  protocol: string;
  appName: string;
  requestId?: number;
  requestName?: string;
};

export interface LogField {
  name: string;
  value: any;
  inline?: boolean;
}

const COLORS = {
  SUCCESS: 5763719,
  ERROR: 15548997,
  INFO: 7340287,
  WARN: 16776960
};

export class DiscordLogger {
  constructor(private readonly config: DiscordLoggerConfig) {
    if (!config || !config.webhookUrl) {
      throw new Error("DiscordLogger: 'webhookUrl' é obrigatório na configuração.");
    }
  }

  async logBusiness(title: string, fields: LogField[] = [], color: keyof typeof COLORS = "INFO") {
    try {

      const safeFields = fields.map(field => ({
        name: field.name,
        value: field.value ? String(field.value).substring(0, 1024) : "N/A",
        inline: field.inline ?? false
      }));

      await axios.post(this.config.webhookUrl, {
        content: null,
        embeds: [
          {
            title: title,
            color: COLORS[color],
            fields: safeFields,
            timestamp: new Date().toISOString(),
            footer: {
              text: this.config.appName,
            },
          },
        ],
        attachments: []
      });
    } catch (error) {
      console.error("Failed to log business message to discord:", error);
    }
  }

  async logDeep(request: any, response: any, color: keyof typeof COLORS = "INFO") {
    try {
      const titleString = `🎟️ ***TICKET*** [${this.config.protocol}] | REQ NO. ${this.config.requestId} - ${this.config.requestName}`;
      const requestString = JSON.stringify(request, null, 2);
      const responseString = JSON.stringify(response, null, 2);

      await axios.post(this.config.webhookUrl, {
        content: titleString + "\n📤 ***REQUEST***:```json" + requestString + "```\n📥 ***RESPONSE***:```json" + responseString + "```",
        embeds: null,
        attachments: []
      });
    } catch (error) {
      console.error("Failed to log deep message to discord:", error);
    }
  }
}
