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
      console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`);
      return null;
    }

    if (response.tokenProperties.action !== recaptchaAction) {
      console.log(`The reCAPTCHA action did not match. Expected: ${recaptchaAction}, Got: ${response.tokenProperties.action}`);
      return null;
    }

    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD) || 0.6;
    return response.riskAnalysis.score > scoreThreshold;
  }
}