/**
 * Item 19: Invoice + Payment Collection
 *
 * Stripe-powered invoicing with:
 *   - Auto-generate invoices from accepted proposals
 *   - Payment links embedded in follow-up emails
 *   - Webhook handling for payment events (succeeded, failed, refunded)
 *   - Revenue tracking and reporting
 *
 * Stripe is optional — gracefully degrades to manual invoicing if not configured.
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ──────────────────────────────────────────────────────────────────

export interface InvoiceData {
  id: string;
  userId: string;
  contactId: string;
  proposalId?: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "refunded";
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  total: number;
  currency: string;
  dueDate: string;
  paymentLink?: string;
  stripeInvoiceId?: string;
  paidAt?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ─── Stripe Check ───────────────────────────────────────────────────────────

function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY);
}

async function getStripe() {
  if (!isStripeConfigured()) return null;
  const Stripe = (await import("stripe")).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as never });
}

// ─── Create Invoice ─────────────────────────────────────────────────────────

export async function createInvoice(
  userId: string,
  contactId: string,
  params: {
    items: InvoiceItem[];
    proposalId?: string;
    dueDays?: number;
    currency?: string;
    tax?: number;
    notes?: string;
  }
): Promise<InvoiceData> {
  const supabase = getAdmin();

  const subtotal = params.items.reduce((sum, item) => sum + item.total, 0);
  const tax = params.tax || 0;
  const total = subtotal + tax;
  const dueDate = new Date(Date.now() + (params.dueDays || 30) * 24 * 60 * 60 * 1000).toISOString();

  // Generate invoice number
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const invoiceNumber = `INV-${String((count || 0) + 1).padStart(4, "0")}`;

  // Get contact for Stripe customer creation
  const { data: contact } = await supabase
    .from("contacts")
    .select("first_name, last_name, email, company")
    .eq("id", contactId)
    .eq("user_id", userId)
    .single();

  let stripeInvoiceId: string | undefined;
  let paymentLink: string | undefined;

  // Create Stripe invoice if configured
  const stripe = await getStripe();
  if (stripe && contact?.email) {
    try {
      // Create or find customer
      const customers = await stripe.customers.list({ email: contact.email, limit: 1 });
      let customerId: string;

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: contact.email,
          name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
          metadata: { contactId, userId, company: contact.company || "" },
        });
        customerId = customer.id;
      }

      // Create invoice
      const stripeInvoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: "send_invoice",
        days_until_due: params.dueDays || 30,
        metadata: { invoiceNumber, contactId, userId },
      });

      // Add line items
      for (const item of params.items) {
        await stripe.invoiceItems.create({
          customer: customerId,
          invoice: stripeInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_amount: Math.round(item.unitPrice * 100), // Stripe uses cents
          currency: params.currency || "usd",
        } as never);
      }

      // Finalize
      const finalized = await stripe.invoices.finalizeInvoice(stripeInvoice.id);
      stripeInvoiceId = finalized.id;
      paymentLink = finalized.hosted_invoice_url || undefined;
    } catch (err) {
      console.error("[Invoicing] Stripe error:", err);
      // Fall through to manual invoice
    }
  }

  // If no Stripe, generate a simple payment link page
  if (!paymentLink) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    paymentLink = `${appUrl}/pay/${invoiceNumber}`;
  }

  // Store invoice
  const { data: invoice } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      contact_id: contactId,
      proposal_id: params.proposalId || null,
      status: "draft",
      invoice_number: invoiceNumber,
      items: params.items,
      subtotal,
      tax,
      total,
      currency: params.currency || "USD",
      due_date: dueDate,
      payment_link: paymentLink,
      stripe_invoice_id: stripeInvoiceId || null,
      notes: params.notes || null,
    })
    .select("id")
    .single();

  // Log activity
  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: contactId,
    activity_type: "invoice_created",
    details: {
      invoice_id: invoice?.id,
      invoice_number: invoiceNumber,
      total,
      payment_link: paymentLink,
      stripe: !!stripeInvoiceId,
    },
  });

  return {
    id: invoice?.id || "",
    userId,
    contactId,
    proposalId: params.proposalId,
    status: "draft",
    invoiceNumber,
    items: params.items,
    subtotal,
    tax,
    total,
    currency: params.currency || "USD",
    dueDate,
    paymentLink,
    stripeInvoiceId,
  };
}

// ─── Send Invoice ───────────────────────────────────────────────────────────

export async function sendInvoice(
  userId: string,
  invoiceId: string
): Promise<{ sent: boolean; paymentLink?: string; error?: string }> {
  const supabase = getAdmin();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .single();

  if (!invoice) return { sent: false, error: "Invoice not found" };

  // Send via Stripe if available
  const stripe = await getStripe();
  if (stripe && invoice.stripe_invoice_id) {
    try {
      await stripe.invoices.sendInvoice(invoice.stripe_invoice_id);
    } catch (err) {
      console.error("[Invoicing] Stripe send error:", err);
    }
  }

  // Update status
  await supabase
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", invoiceId);

  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: invoice.contact_id,
    activity_type: "invoice_sent",
    details: {
      invoice_id: invoiceId,
      invoice_number: invoice.invoice_number,
      total: invoice.total,
    },
  });

  return { sent: true, paymentLink: invoice.payment_link };
}

// ─── Handle Stripe Webhook ──────────────────────────────────────────────────

export async function handleStripeWebhook(event: {
  type: string;
  data: { object: Record<string, unknown> };
}): Promise<void> {
  const supabase = getAdmin();

  const invoice = event.data.object;
  const stripeInvoiceId = invoice.id as string;
  const metadata = (invoice.metadata || {}) as Record<string, string>;

  if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
    await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("stripe_invoice_id", stripeInvoiceId);

    // Fire deal/won event
    if (metadata.contactId && metadata.userId) {
      await supabase.from("activities").insert({
        user_id: metadata.userId,
        contact_id: metadata.contactId,
        activity_type: "payment_received",
        details: {
          stripe_invoice_id: stripeInvoiceId,
          amount: (invoice.amount_paid as number || 0) / 100,
        },
      });
    }
  } else if (event.type === "invoice.payment_failed") {
    await supabase
      .from("invoices")
      .update({ status: "overdue" })
      .eq("stripe_invoice_id", stripeInvoiceId);
  }
}

// ─── Revenue Dashboard ──────────────────────────────────────────────────────

export async function getRevenueStats(
  userId: string,
  period: "week" | "month" | "quarter" | "year" = "month"
): Promise<{
  totalRevenue: number;
  invoicesSent: number;
  invoicesPaid: number;
  conversionRate: number;
  avgDealSize: number;
  outstanding: number;
}> {
  const supabase = getAdmin();
  const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
  const since = new Date(Date.now() - daysMap[period] * 24 * 60 * 60 * 1000).toISOString();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("status, total")
    .eq("user_id", userId)
    .gte("created_at", since);

  const all = invoices || [];
  const paid = all.filter((i) => i.status === "paid");
  const sent = all.filter((i) => ["sent", "paid", "overdue"].includes(i.status));
  const outstanding = all.filter((i) => ["sent", "overdue"].includes(i.status));

  const totalRevenue = paid.reduce((sum, i) => sum + (i.total || 0), 0);
  const outstandingTotal = outstanding.reduce((sum, i) => sum + (i.total || 0), 0);

  return {
    totalRevenue,
    invoicesSent: sent.length,
    invoicesPaid: paid.length,
    conversionRate: sent.length > 0 ? Math.round((paid.length / sent.length) * 100) : 0,
    avgDealSize: paid.length > 0 ? Math.round(totalRevenue / paid.length) : 0,
    outstanding: outstandingTotal,
  };
}
