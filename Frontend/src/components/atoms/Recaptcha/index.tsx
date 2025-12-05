import { forwardRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

interface RecaptchaProps {
  sitekey?: string;
  size?: "invisible" | "normal" | "compact";
}

const Recaptcha = forwardRef<ReCAPTCHA, RecaptchaProps>(({ sitekey, size = "invisible" }, ref) => {
  return (
    <ReCAPTCHA
      ref={ref}
      size={size}
      sitekey={sitekey || import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
    />
  );
});

export default Recaptcha;

