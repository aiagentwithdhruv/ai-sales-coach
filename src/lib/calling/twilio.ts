/**
 * Twilio Voice Integration
 * Handles outbound call initiation, TwiML generation, and call management.
 */

import twilio from "twilio";

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
  }
  return twilio(accountSid, authToken);
};

export function isTwilioConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

/**
 * Initiate an outbound call via Twilio
 */
export async function initiateOutboundCall(params: {
  to: string;
  from?: string;
  webhookBaseUrl: string;
  callId: string; // Our internal call ID for tracking
  agentId: string;
}): Promise<{ callSid: string; status: string }> {
  const client = getTwilioClient();
  const fromNumber = params.from || process.env.TWILIO_PHONE_NUMBER!;

  const call = await client.calls.create({
    to: params.to,
    from: fromNumber,
    // When call connects, Twilio will POST to our webhook
    url: `${params.webhookBaseUrl}/api/webhooks/twilio/voice?callId=${params.callId}&agentId=${params.agentId}`,
    statusCallback: `${params.webhookBaseUrl}/api/webhooks/twilio/status?callId=${params.callId}`,
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    statusCallbackMethod: "POST",
    record: true,
    recordingStatusCallback: `${params.webhookBaseUrl}/api/webhooks/twilio/recording?callId=${params.callId}`,
    recordingStatusCallbackMethod: "POST",
    // Enable machine detection for voicemail
    machineDetection: "DetectMessageEnd",
    asyncAmd: "true",
    asyncAmdStatusCallback: `${params.webhookBaseUrl}/api/webhooks/twilio/amd?callId=${params.callId}`,
  });

  return {
    callSid: call.sid,
    status: call.status,
  };
}

/**
 * Generate TwiML for connecting to a WebSocket stream (for real-time AI conversation)
 */
export function generateStreamTwiML(params: {
  webhookBaseUrl: string;
  callId: string;
  agentId: string;
  greeting?: string;
}): string {
  const twiml = new twilio.twiml.VoiceResponse();

  // Say the greeting first
  if (params.greeting) {
    twiml.say({
      voice: "Polly.Matthew",
    }, params.greeting);
  }

  // Connect to WebSocket for bidirectional audio streaming
  const connect = twiml.connect();
  const stream = connect.stream({
    url: `wss://${new URL(params.webhookBaseUrl).host}/api/calls/stream`,
  });
  stream.parameter({ name: "callId", value: params.callId });
  stream.parameter({ name: "agentId", value: params.agentId });

  return twiml.toString();
}

/**
 * Generate TwiML to say a message and gather speech input (simpler, non-WebSocket approach)
 */
export function generateConversationTwiML(params: {
  webhookBaseUrl: string;
  callId: string;
  agentId: string;
  message: string;
  isFirst?: boolean;
}): string {
  const twiml = new twilio.twiml.VoiceResponse();

  // Say the AI's message
  twiml.say({
    voice: "Polly.Matthew",
  }, params.message);

  // Gather speech input from the human
  const gather = twiml.gather({
    input: ["speech"],
    speechTimeout: "auto",
    speechModel: "experimental_conversations",
    action: `${params.webhookBaseUrl}/api/webhooks/twilio/gather?callId=${params.callId}&agentId=${params.agentId}`,
    method: "POST",
  });

  // If no input, say goodbye
  twiml.say("I didn't catch that. Thank you for your time. Goodbye!");
  twiml.hangup();

  return twiml.toString();
}

/**
 * End an active call
 */
export async function endCall(callSid: string): Promise<void> {
  const client = getTwilioClient();
  await client.calls(callSid).update({ status: "completed" });
}

/**
 * Get call details from Twilio
 */
export async function getCallDetails(callSid: string) {
  const client = getTwilioClient();
  return client.calls(callSid).fetch();
}

/**
 * List available phone numbers to purchase
 */
export async function searchAvailableNumbers(params: {
  countryCode?: string;
  areaCode?: string;
  contains?: string;
  limit?: number;
}) {
  const client = getTwilioClient();
  const country = params.countryCode || "US";

  const numbers = await client.availablePhoneNumbers(country).local.list({
    areaCode: params.areaCode ? parseInt(params.areaCode) : undefined,
    contains: params.contains,
    limit: params.limit || 10,
    voiceEnabled: true,
  });

  return numbers.map((n) => ({
    phoneNumber: n.phoneNumber,
    friendlyName: n.friendlyName,
    locality: n.locality,
    region: n.region,
    capabilities: {
      voice: n.capabilities.voice,
      sms: n.capabilities.sms,
    },
  }));
}

/**
 * Purchase a phone number
 */
export async function purchaseNumber(phoneNumber: string, webhookBaseUrl: string) {
  const client = getTwilioClient();
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber,
    voiceUrl: `${webhookBaseUrl}/api/webhooks/twilio/voice`,
    voiceMethod: "POST",
    statusCallback: `${webhookBaseUrl}/api/webhooks/twilio/status`,
    statusCallbackMethod: "POST",
  });

  return {
    sid: purchased.sid,
    phoneNumber: purchased.phoneNumber,
    friendlyName: purchased.friendlyName,
  };
}

/**
 * Validate Twilio webhook signature
 */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  );
}
