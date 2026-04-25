import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error("Twilio environment variables are missing.");
}

export const twilioClient = twilio(accountSid, authToken);

export const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID as string;