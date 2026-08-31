
const provider = process.env.SMS_PROVIDER || "simulation";

/**
 * Dispatches a real SMS text containing the OTP code to the target phone number.
 * Supports Twilio, Fast2SMS, and console simulation fallbacks.
 * 
 * @param phone 10-digit Indian phone number (without country prefix)
 * @param code 6-digit OTP code to send
 * @param name Farmer's name
 */
export async function sendRegisterOtpSms(phone: string, code: string, name: string): Promise<boolean> {
  console.log(`\n--- OTP SMS Dispatch Initiation (${provider.toUpperCase()}) ---`);
  
  if (provider === "twilio") {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !twilioNumber) {
        throw new Error("Missing Twilio configuration parameters in environment variables.");
      }

      // @ts-ignore
      const twilioModule: any = await import("twilio").catch(() => null);
      if (!twilioModule) throw new Error("Twilio package is not installed.");
      const twilio = twilioModule.default;
      const client = twilio(accountSid, authToken);

      // Deliver text to phone with standard Indian country prefix (+91)
      const message = await client.messages.create({
        body: `Dear ${name}, your PashuRaksha OTP verification code is ${code}. Valid for 5 minutes.`,
        to: `+91${phone}`,
        from: twilioNumber,
      });

      console.log(`✅ [Twilio SMS Deliver Success] Message SID: ${message.sid}`);
      return true;
    } catch (error: unknown) {
      console.error("❌ [Twilio SMS Delivery Error]:", error);
      throw new Error("Failed to send OTP message via Twilio provider.");
    }
  } 
  
  if (provider === "fast2sms") {
    try {
      const apiKey = process.env.FAST2SMS_API_KEY;
      if (!apiKey) {
        throw new Error("Missing Fast2SMS API key in environment variables.");
      }

      // Fast2SMS dev bulkV2 OTP route delivery endpoint
      const targetUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
        apiKey
      )}&variables_values=${encodeURIComponent(code)}&route=otp&numbers=${encodeURIComponent(
        phone
      )}`;

      const res = await fetch(targetUrl, { method: "GET" });
      const responseData = await res.json() as { return?: boolean; message?: string };

      if (!res.ok || !responseData.return) {
        console.error("Fast2SMS gateway returned error status:", responseData);
        throw new Error(responseData.message || "Fast2SMS API call returned success false");
      }

      console.log(`✅ [Fast2SMS SMS Deliver Success] Response message: ${responseData.message}`);
      return true;
    } catch (error: unknown) {
      console.error("❌ [Fast2SMS SMS Delivery Error]:", error);
      throw new Error("Failed to send OTP message via Fast2SMS provider.");
    }
  }

  // Fallback / Simulation Channel
  console.log("========================================================");
  console.log(`📲 [SMS GATEWAY SIMULATION] OTP for Farmer Registration`);
  console.log(`Farmer Name: ${name}`);
  console.log(`Phone: +91 ${phone}`);
  console.log(`Verification OTP Code: [${code}] (Valid for 5 minutes)`);
  console.log("========================================================");
  console.log(`📢 [Tip] Add Twilio/Fast2SMS credentials to your .env to send real texts!`);
  console.log("========================================================\n");
  return true;
}
