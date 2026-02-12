import { NextRequest } from "next/server";
import { Resend } from "resend";
import { authenticateUser } from "@/lib/crm/contacts";

const jsonHeaders = { "Content-Type": "application/json" };

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface SendQuotationBody {
  to: string;
  clientName: string;
  company: string;
  referenceNumber: string;
  productService: string;
  lineItems: LineItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  validUntil: string;
  notes: string;
  aiEnhancement: string;
  senderName?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function buildEmailHTML(data: SendQuotationBody, senderEmail: string): string {
  const lineItemRows = data.lineItems
    .filter((item) => item.description)
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #1a1a2e; color: #c0c0c0; font-size: 14px;">${item.description}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #1a1a2e; color: #c0c0c0; font-size: 14px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #1a1a2e; color: #c0c0c0; font-size: 14px; text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #1a1a2e; color: #c0c0c0; font-size: 14px; text-align: right; font-weight: 600;">${formatCurrency(item.quantity * item.unitPrice)}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation ${data.referenceNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0d1117 0%, #161b22 100%); border-radius: 12px 12px 0 0; padding: 32px; border: 1px solid #21262d; border-bottom: none;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <h1 style="margin: 0; color: #e6e6e6; font-size: 24px; font-weight: 700;">QUOTATION</h1>
            <p style="margin: 4px 0 0; color: #7b8794; font-size: 14px;">${data.referenceNumber}</p>
          </td>
          <td style="text-align: right;">
            <p style="margin: 0; color: #7b8794; font-size: 13px;">Date: ${new Date().toLocaleDateString()}</p>
            <p style="margin: 4px 0 0; color: #7b8794; font-size: 13px;">Valid Until: ${data.validUntil}</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Client Info -->
    <div style="background: #0d1117; padding: 24px 32px; border-left: 1px solid #21262d; border-right: 1px solid #21262d;">
      <p style="margin: 0 0 4px; color: #7b8794; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">PREPARED FOR</p>
      <p style="margin: 0; color: #e6e6e6; font-size: 16px; font-weight: 600;">${data.clientName}</p>
      ${data.company ? `<p style="margin: 2px 0 0; color: #7b8794; font-size: 14px;">${data.company}</p>` : ""}
      <p style="margin: 2px 0 0; color: #58a6ff; font-size: 14px;">${data.to}</p>
    </div>

    ${data.productService ? `
    <!-- Product / Service -->
    <div style="background: #0d1117; padding: 16px 32px; border-left: 1px solid #21262d; border-right: 1px solid #21262d;">
      <p style="margin: 0 0 4px; color: #7b8794; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">PRODUCT / SERVICE</p>
      <p style="margin: 0; color: #c0c0c0; font-size: 14px;">${data.productService}</p>
    </div>
    ` : ""}

    <!-- Line Items Table -->
    <div style="background: #0d1117; padding: 16px 32px; border-left: 1px solid #21262d; border-right: 1px solid #21262d;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <thead>
          <tr style="background: #161b22;">
            <th style="padding: 10px 12px; text-align: left; color: #7b8794; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #21262d;">Description</th>
            <th style="padding: 10px 12px; text-align: center; color: #7b8794; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #21262d;">Qty</th>
            <th style="padding: 10px 12px; text-align: right; color: #7b8794; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #21262d;">Unit Price</th>
            <th style="padding: 10px 12px; text-align: right; color: #7b8794; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #21262d;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemRows}
        </tbody>
      </table>
    </div>

    <!-- Pricing Summary -->
    <div style="background: #0d1117; padding: 20px 32px; border-left: 1px solid #21262d; border-right: 1px solid #21262d;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 280px; margin-left: auto;">
        <tr>
          <td style="padding: 6px 0; color: #7b8794; font-size: 14px;">Subtotal</td>
          <td style="padding: 6px 0; color: #c0c0c0; font-size: 14px; text-align: right;">${formatCurrency(data.subtotal)}</td>
        </tr>
        ${data.discountPercent > 0 ? `
        <tr>
          <td style="padding: 6px 0; color: #7b8794; font-size: 14px;">Discount (${data.discountPercent}%)</td>
          <td style="padding: 6px 0; color: #3fb950; font-size: 14px; text-align: right;">-${formatCurrency(data.discountAmount)}</td>
        </tr>` : ""}
        ${data.taxPercent > 0 ? `
        <tr>
          <td style="padding: 6px 0; color: #7b8794; font-size: 14px;">Tax (${data.taxPercent}%)</td>
          <td style="padding: 6px 0; color: #c0c0c0; font-size: 14px; text-align: right;">+${formatCurrency(data.taxAmount)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 12px 0 6px; color: #e6e6e6; font-size: 18px; font-weight: 700; border-top: 2px solid #21262d;">Total</td>
          <td style="padding: 12px 0 6px; color: #58a6ff; font-size: 18px; font-weight: 700; text-align: right; border-top: 2px solid #21262d;">${formatCurrency(data.total)}</td>
        </tr>
      </table>
    </div>

    ${data.notes ? `
    <!-- Terms -->
    <div style="background: #0d1117; padding: 20px 32px; border-left: 1px solid #21262d; border-right: 1px solid #21262d;">
      <p style="margin: 0 0 8px; color: #7b8794; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">TERMS & CONDITIONS</p>
      <p style="margin: 0; color: #8b949e; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${data.notes}</p>
    </div>
    ` : ""}

    ${data.aiEnhancement ? `
    <!-- AI Enhanced Proposal -->
    <div style="background: #0d1117; padding: 20px 32px; border-left: 1px solid #21262d; border-right: 1px solid #21262d;">
      <p style="margin: 0 0 8px; color: #7b8794; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">PROPOSAL DETAILS</p>
      <div style="color: #8b949e; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${data.aiEnhancement}</div>
    </div>
    ` : ""}

    <!-- Footer -->
    <div style="background: #161b22; border-radius: 0 0 12px 12px; padding: 24px 32px; border: 1px solid #21262d; border-top: none; text-align: center;">
      <p style="margin: 0; color: #7b8794; font-size: 12px;">
        Sent by ${data.senderName || senderEmail} via QuotaHit AI Sales Coach
      </p>
      <p style="margin: 8px 0 0; color: #484f58; font-size: 11px;">
        Please reply to this email with any questions about this quotation.
      </p>
    </div>

  </div>
</body>
</html>`;
}

/**
 * POST /api/quotations/send
 * Send a quotation via email using Resend
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "Email service not configured. Add RESEND_API_KEY to your environment variables.",
        setup: "Get a free API key at https://resend.com (100 emails/day free)",
      }),
      { status: 503, headers: jsonHeaders }
    );
  }

  const body: SendQuotationBody = await req.json();

  if (!body.to || !body.referenceNumber) {
    return new Response(
      JSON.stringify({ error: "Recipient email and reference number are required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  // Get sender email from Supabase user profile
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: user } = await supabase.auth.admin.getUserById(auth.userId);
  const senderEmail = user?.user?.email || "noreply@quotahit.com";
  const senderName = body.senderName || user?.user?.user_metadata?.full_name || senderEmail;

  const resend = new Resend(apiKey);
  const fromDomain = process.env.RESEND_FROM_DOMAIN;
  // Use verified domain if available, otherwise Resend's default
  const fromEmail = fromDomain
    ? `${senderName} <quotations@${fromDomain}>`
    : `QuotaHit <onboarding@resend.dev>`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: body.to,
      replyTo: senderEmail,
      subject: `Quotation ${body.referenceNumber} — ${body.productService || "Proposal"}`,
      html: buildEmailHTML(body, senderEmail),
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: data?.id,
        message: `Quotation sent to ${body.to}`,
      }),
      { headers: jsonHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Failed to send email",
        details: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: jsonHeaders }
    );
  }
}
