import axios, { AxiosError } from "axios";

const CLICKSIGN_API_URL = "https://app.clicksign.com/api/v3";

interface ClickSignLinks {
  self: string;
  related?: string;
}

interface ClickSignRelationships {
  documents: { links: ClickSignLinks };
  signers: { links: ClickSignLinks };
  requirements: { links: ClickSignLinks };
}

interface ClickSignAttributes {
  name: string;
  status: string;
  deadline_at: string;
  locale: string;
  auto_close: boolean;
  remind_interval: number;
  block_after_refusal: boolean;
  created: string;
  modified: string;
}

interface ClickSignEnvelopeResponse {
  data: {
    id: string;
    type: string;
    links: {
      self: string;
    };
    attributes: ClickSignAttributes;
    relationships: ClickSignRelationships;
  };
}

export class ClickSignService {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Missing ClickSign API key");
    }

    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      Authorization: this.apiKey,
    };
  }

  async createEnvelope({
    name,
    locale = "pt-BR",
    autoClose = true,
    remind_interval = 3,
  }: {
    name: string;
    locale?: string;
    autoClose?: boolean;
    deadline_at?: string;
    remind_interval?: number;
  }): Promise<ClickSignEnvelopeResponse> {
    const response = await axios.post<ClickSignEnvelopeResponse>(
      `${CLICKSIGN_API_URL}/envelopes`,
      {
        data: {
          type: "envelopes",
          attributes: {
            name,
            locale,
            auto_close: autoClose,
            remind_interval,
            block_after_refusal: true,
          },
        },
      },
      { headers: this.getHeaders() }
    );

    return response.data;
  }

  async addDocument({
    envelopeId,
    templateKey,
    documentName,
    content,
    ticketId,
    workflowId,
    stepId,
  }: {
    envelopeId: string;
    templateKey: string;
    documentName: string;
    content: Record<string, string>;
    ticketId: string;
    workflowId: string;
    stepId: string;
  }) {
    const response = await axios
      .post<{ data: { id: string } }>(
        `${CLICKSIGN_API_URL}/envelopes/${envelopeId}/documents`,
        {
          data: {
            type: "documents",
            attributes: {
              filename: documentName,
              template: {
                key: templateKey,
                data: content,
              },
              metadata: {
                ticketId,
                workflowId,
                stepId,
              },
            },
          },
        },
        { headers: this.getHeaders() }
      )
      .catch((err: AxiosError) => {
        throw new Error(
          `Error adding document ${err.message} ${JSON.stringify(
            err.response?.data
          )}`
        );
      });

    return response.data?.data;
  }

  async sendNotification({
    envelopeId,
    message = "",
    signerId,
  }: {
    envelopeId: string;
    message?: string;
    signerId: string;
  }) {
    await axios
      .post(
        `${CLICKSIGN_API_URL}/envelopes/${envelopeId}/signers/${signerId}/notifications`,
        {
          data: {
            type: "notifications",
            attributes: {
              message,
            },
          },
        },
        { headers: this.getHeaders() }
      )
      .catch((err: AxiosError) => {
        throw new Error(
          `Error sending notification ${err.message} ${JSON.stringify(
            err.response?.data
          )}`
        );
      });
  }

  async addSigner({
    signerName,
    signerEmail,
    refusable = false,
    envelopeId,
  }: {
    signerName: string;
    signerEmail: string;
    refusable?: boolean;
    envelopeId: string;
  }) {
    const response = await axios
      .post<{ data: { id: string } }>(
        `${CLICKSIGN_API_URL}/envelopes/${envelopeId}/signers`,
        {
          data: {
            type: "signers",
            attributes: {
              email: signerEmail,
              name: signerName,
              refusable,
              communicate_events: {
                document_signed: "email",
                signature_request: "email",
                signature_reminder: "email",
              },
            },
          },
        },
        { headers: this.getHeaders() }
      )
      .catch((err: AxiosError) => {
        throw new Error(
          `Error adding signer ${err.message} ${JSON.stringify(
            err.response?.data
          )}`
        );
      });

    return {
      id: response.data?.data.id,
      userId: signerEmail,
    };
  }

  async startEnvelope(envelopeId: string): Promise<void> {
    await axios
      .patch(
        `${CLICKSIGN_API_URL}/envelopes/${envelopeId}`,
        {
          data: {
            id: envelopeId,
            type: "envelopes",
            attributes: {
              status: "running",
            },
          },
        },
        { headers: this.getHeaders() }
      )
      .catch((err: AxiosError) => {
        throw new Error(
          `Error starting envelope ${err.message} ${JSON.stringify(
            err.response?.data
          )}`
        );
      });
  }

  async listTemplates() {
    const response = await axios.get<{
      data: {
        id: string;
        type: string;
        links: {
          self: string;
          files: {
            original: string;
          };
        };
        attributes: {
          name: string;
          color: string;
          created: string;
          modified: string;
        };
      }[];
      meta: {
        record_count: number;
      };
      links: {
        first: string;
        last: string;
      };
    }>(`${CLICKSIGN_API_URL}/templates`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async addRequirements({
    envelopeId,
    documentId,
    requirements,
  }: {
    envelopeId: string;
    documentId: string;
    requirements: {
      signer: string;
      type: `${string}:${string}`;
    }[];
  }) {
    for (const requirement of requirements) {
      const role = requirement.type.split(":")[1];
      console.log("Adding requirement", role, requirement.signer);
      await axios
        .post(
          `${CLICKSIGN_API_URL}/envelopes/${envelopeId}/bulk_requirements`,
          {
            "atomic:operations": [
              {
                op: "add",
                data: {
                  type: "requirements",
                  attributes: {
                    action: "provide_evidence",
                    auth: "email",
                  },
                  relationships: {
                    document: {
                      data: {
                        type: "documents",
                        id: documentId,
                      },
                    },
                    signer: {
                      data: {
                        type: "signers",
                        id: requirement.signer,
                      },
                    },
                  },
                },
              },
              {
                op: "add",
                data: {
                  type: "requirements",
                  attributes: {
                    action: "agree",
                    role: role,
                  },
                  relationships: {
                    document: {
                      data: {
                        type: "documents",
                        id: documentId,
                      },
                    },
                    signer: {
                      data: {
                        type: "signers",
                        id: requirement.signer,
                      },
                    },
                  },
                },
              },
            ],
          },
          { headers: this.getHeaders() }
        )
        .catch((err: AxiosError) => {
          throw new Error(
            `Error adding requirements ${err.message} ${JSON.stringify(
              err.response?.data
            )}`
          );
        });
    }
  }
}
