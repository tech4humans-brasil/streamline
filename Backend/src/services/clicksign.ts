import axios from "axios";

const CLICKSIGN_API_URL = "https://sandbox.clicksign.com/api/v3";

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
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      Authorization: this.apiKey,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    };
  }

  async createEnvelope({
    name,
    locale = "pt-BR",
    autoClose = true,
    deadline_at,
    remind_interval,
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
            deadline_at,
            remind_interval,
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
    const response = await axios.post<{ data: { id: string } }>(
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
    );

    return response.data?.data;
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
    const response = await axios.post<{ data: { id: string } }>(
      `${CLICKSIGN_API_URL}/envelopes/${envelopeId}/signers`,
      {
        data: {
          type: "signers",
          attributes: {
            email: signerEmail,
            name: signerName,
            has_documentation: true,
            refusable,
            communicate_events: {
              document_signed: "email",
              signature_request: "sms",
              signature_reminder: "email",
            },
          },
        },
      },
      { headers: this.getHeaders() }
    );

    return {
      id: response.data?.data.id,
      userId: signerEmail,
    };
  }

  async startEnvelope(envelopeId: string): Promise<void> {
    await axios.post(
      `${CLICKSIGN_API_URL}/envelopes/${envelopeId}/start`,
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
    );
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
    await axios.post(
      `${CLICKSIGN_API_URL}/envelopes/${envelopeId}/bulk_requirements`,
      {
        "atomic:operations": requirements.map((requirement) => ({
          op: "add",
          data: {
            type: "requirements",
            attributes: {
              action: requirement.type.split(":")[0],
              role: requirement.type.split(":")[1],
              auths: "email",
            },
            relationships: {
              document: {
                data: {
                  id: documentId,
                  type: "documents",
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
        })),
      },
      { headers: this.getHeaders() }
    );
  }
}
