import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise";

const projectID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const recaptchaKey = process.env.RECAPTCHA_SITE_KEY;
const googleAuthCredentials = process.env.GOOGLE_JSON_AUTH_CREDENTIALS;

export class RecaptchaService {
  private projectID: string;
  private recaptchaKey: string;
  private credentials: any;
  private client: RecaptchaEnterpriseServiceClient | null;

  constructor() {
    this.projectID = projectID;
    this.recaptchaKey = recaptchaKey;
    this.credentials = JSON.parse(googleAuthCredentials.replace(/\n/g, "\\n").replace(/\r/g, "\\r"));

    this.client = new RecaptchaEnterpriseServiceClient({
      projectId: this.projectID,
      credentials: this.credentials,
    });
  }

  async verify({
    token,
    recaptchaAction,
  }: { token: string, recaptchaAction: string }) {
    const projectPath = this.client.projectPath(this.projectID);

    const request = ({
      assessment: {
        event: {
          token: token,
          siteKey: this.recaptchaKey,
        },
      },
      parent: projectPath,
    });

    const [response] = await this.client.createAssessment(request);

    if (!response.tokenProperties.valid) {
      throw {
        status: 400,
        message: `The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`,
      };
    }

    if (!!response.tokenProperties.action && response.tokenProperties.action !== recaptchaAction) {
      throw {
        status: 400,
        message: `The CreateAssessment call failed because the action was: ${response.tokenProperties.action}`,
      };
    }

    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD) || 0.6;

    if (response.riskAnalysis.score < scoreThreshold) {
      throw {
        status: 400,
        message: `The score was: ${response.riskAnalysis.score}`,
      };
    }

    return true;
  }
}