"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { exportQuotationPDF } from "@/lib/export-pdf";
import { getAuthToken } from "@/lib/auth-token";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Mail,
  Copy,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Clock,
  DollarSign,
  Building,
  User,
  Calendar,
  Hash,
  RotateCcw,
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Send,
  XCircle,
  Lightbulb,
  CalendarClock,
  Ticket,
  Search,
  Filter,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type QuotationStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Quotation {
  id: string;
  referenceNumber: string;
  clientName: string;
  company: string;
  email: string;
  productService: string;
  lineItems: LineItem[];
  discountPercent: number;
  taxPercent: number;
  validUntil: string;
  notes: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  aiEnhancement: string;
  createdAt: string;
  status: QuotationStatus;
  followUpDate: string;
  followUpTime: string;
  followUpNotes: string;
  followUpNotificationId: string;
  aiSuggestions: string;
  contactId: string;
}

const STATUS_CONFIG: Record<QuotationStatus, { label: string; color: string; bgColor: string; icon: typeof FileText }> = {
  draft: { label: "Draft", color: "text-silver", bgColor: "bg-silver/10", icon: FileText },
  sent: { label: "Sent", color: "text-neonblue", bgColor: "bg-neonblue/10", icon: Send },
  viewed: { label: "Viewed", color: "text-warningamber", bgColor: "bg-warningamber/10", icon: Eye },
  accepted: { label: "Accepted", color: "text-automationgreen", bgColor: "bg-automationgreen/10", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-errorred", bgColor: "bg-errorred/10", icon: XCircle },
  expired: { label: "Expired", color: "text-mist", bgColor: "bg-mist/10", icon: Clock },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateRefNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `QUO-${year}-${seq}`;
}

function createLineItem(): LineItem {
  return { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function getDefaultValidDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

function getFollowUpStatus(followUpDate: string, followUpTime: string): "overdue" | "due-today" | "upcoming" | "none" {
  if (!followUpDate) return "none";
  const now = new Date();
  const target = new Date(`${followUpDate}T${followUpTime || "09:00"}`);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffMs < 0) return "overdue";
  if (diffHours < 24) return "due-today";
  return "upcoming";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Component ───────────────────────────────────────────────────────────────

function QuotationsPageInner() {
  const searchParams = useSearchParams();

  // Form state
  const [referenceNumber, setReferenceNumber] = useState(generateRefNumber);
  const [clientName, setClientName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [productService, setProductService] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([createLineItem()]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [validUntil, setValidUntil] = useState(getDefaultValidDate);
  const [notes, setNotes] = useState(
    "Payment terms: Net 30 days.\nThis quotation is valid for the period specified above."
  );
  const [status, setStatus] = useState<QuotationStatus>("draft");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("09:00");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [contactId, setContactId] = useState("");

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [aiEnhancement, setAiEnhancement] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedQuotations, setSavedQuotations] = useState<Quotation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<QuotationStatus | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [followUpReminders, setFollowUpReminders] = useState<Quotation[]>([]);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("quotation_history");
      if (stored) {
        const parsed: Quotation[] = JSON.parse(stored);
        setSavedQuotations(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Check for follow-up reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const reminders = savedQuotations.filter((q) => {
        if (!q.followUpDate) return false;
        const target = new Date(`${q.followUpDate}T${q.followUpTime || "09:00"}`);
        const diffMs = target.getTime() - now.getTime();
        // Show if overdue or due within 24 hours
        return diffMs < 24 * 60 * 60 * 1000;
      });
      setFollowUpReminders(reminders);

      // Browser notification for overdue items
      if (reminders.some((r) => getFollowUpStatus(r.followUpDate, r.followUpTime) === "overdue")) {
        if (Notification.permission === "granted") {
          const overdue = reminders.filter((r) => getFollowUpStatus(r.followUpDate, r.followUpTime) === "overdue");
          overdue.forEach((r) => {
            const key = `notified_${r.id}`;
            if (!sessionStorage.getItem(key)) {
              new Notification("Quotation Follow-Up Overdue", {
                body: `${r.referenceNumber} — ${r.clientName} at ${r.company}`,
                icon: "/favicon.ico",
              });
              sessionStorage.setItem(key, "true");
            }
          });
        }
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [savedQuotations]);

  // Request notification permission
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Pre-fill from CRM query params
  useEffect(() => {
    const name = searchParams.get("name");
    const comp = searchParams.get("company");
    const em = searchParams.get("email");
    const cid = searchParams.get("contactId");
    const ref = searchParams.get("ref");
    if (name) setClientName(name);
    if (comp) setCompany(comp);
    if (em) setEmail(em);
    if (cid) setContactId(cid);
    // Load specific quotation by reference
    if (ref) {
      try {
        const stored = localStorage.getItem("quotation_history");
        if (stored) {
          const parsed: Quotation[] = JSON.parse(stored);
          const found = parsed.find((q) => q.referenceNumber === ref);
          if (found) loadQuotation(found);
        }
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  // ─── Calculations ──────────────────────────────────────────────────────────

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxPercent / 100);
  const total = taxableAmount + taxAmount;

  // ─── Line Items ────────────────────────────────────────────────────────────

  const addLineItem = () => setLineItems((prev) => [...prev, createLineItem()]);
  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };
  const updateLineItem = (id: string, field: keyof Omit<LineItem, "id">, value: string | number) => {
    setLineItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // ─── AI Enhancement ────────────────────────────────────────────────────────

  const handleGenerateWithAI = async () => {
    if (!clientName.trim() && !productService.trim()) return;
    setIsGenerating(true);
    setAiEnhancement("");

    const prompt = `You are a professional sales proposal writer. Enhance this quotation into a polished, professional proposal.

QUOTATION DETAILS:
- Reference: ${referenceNumber}
- Client: ${clientName} at ${company}
- Product/Service: ${productService}
- Line Items:
${lineItems
  .filter((i) => i.description)
  .map((i) => `  - ${i.description}: ${i.quantity} x ${formatCurrency(i.unitPrice)} = ${formatCurrency(i.quantity * i.unitPrice)}`)
  .join("\n")}
- Subtotal: ${formatCurrency(subtotal)}
- Discount: ${discountPercent}% (${formatCurrency(discountAmount)})
- Tax: ${taxPercent}% (${formatCurrency(taxAmount)})
- Total: ${formatCurrency(total)}
- Valid Until: ${validUntil}
- Notes: ${notes}

Please provide:
1. A professional opening paragraph addressing the client by name, referencing their company
2. Value propositions for each line item (why this benefits them)
3. Professional terms and conditions
4. A compelling closing paragraph with clear call-to-action
5. Any recommended upsells or add-ons

Format with markdown headings and bullet points. Keep it concise but impressive.`;

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: prompt,
          model: localStorage.getItem("ai_model") || "gpt-4.1-mini",
        }),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                fullText += JSON.parse(line.slice(2));
              } catch {
                fullText += line.slice(2);
              }
            } else if (line.trim()) {
              fullText += line;
            }
          }
          setAiEnhancement(fullText);
        }
      }
    } catch (err) {
      console.error("AI generation error:", err);
      setAiEnhancement("Failed to generate AI enhancement. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── AI Smart Suggestions ─────────────────────────────────────────────────

  const handleGetSuggestions = async () => {
    setIsSuggesting(true);
    setAiSuggestions("");

    // Build context from notes + last quotation data
    const recentQuotations = savedQuotations.slice(0, 5);
    const historyContext = recentQuotations.length > 0
      ? `\n\nRECENT QUOTATION HISTORY (for context):\n${recentQuotations
          .map((q) => `- ${q.referenceNumber}: ${q.clientName} at ${q.company} — ${q.productService} — ${formatCurrency(q.total)} — Status: ${q.status}`)
          .join("\n")}`
      : "";

    const prompt = `You are an expert sales advisor. Based on the quotation details and context below, provide smart, actionable suggestions to improve this quotation's chances of being accepted.

CURRENT QUOTATION:
- Client: ${clientName || "(not filled yet)"} at ${company || "(not filled yet)"}
- Product/Service: ${productService || "(not filled yet)"}
- Line Items: ${lineItems.filter((i) => i.description).map((i) => `${i.description} (${formatCurrency(i.quantity * i.unitPrice)})`).join(", ") || "(none yet)"}
- Total: ${formatCurrency(total)}
- Discount: ${discountPercent}%
- Notes/Terms: ${notes}
${historyContext}

USER NOTES: ${notes}

Please provide 4-6 concise suggestions covering:
1. **Pricing Strategy** — Is the pricing competitive? Suggest discounts or bundling
2. **Value Framing** — How to better position the value proposition
3. **Urgency & Closing** — Suggest time-limited offers or incentives
4. **Upsell Opportunities** — What else could be offered
5. **Terms Improvement** — Better payment terms or guarantees
6. **Follow-Up Strategy** — When and how to follow up

Keep each suggestion to 1-2 sentences. Use bullet points with bold headers.`;

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: prompt,
          model: localStorage.getItem("ai_model") || "gpt-4.1-mini",
        }),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                fullText += JSON.parse(line.slice(2));
              } catch {
                fullText += line.slice(2);
              }
            } else if (line.trim()) {
              fullText += line;
            }
          }
          setAiSuggestions(fullText);
        }
      }
    } catch (err) {
      console.error("AI suggestion error:", err);
      setAiSuggestions("Failed to generate suggestions. Please try again.");
    } finally {
      setIsSuggesting(false);
    }
  };

  // ─── Save ──────────────────────────────────────────────────────────────────

  const saveQuotation = useCallback(() => {
    const quotation: Quotation = {
      id: editingId || crypto.randomUUID(),
      referenceNumber,
      clientName,
      company,
      email,
      productService,
      lineItems,
      discountPercent,
      taxPercent,
      validUntil,
      notes,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      aiEnhancement,
      createdAt: editingId
        ? savedQuotations.find((q) => q.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      status,
      followUpDate,
      followUpTime,
      followUpNotes,
      followUpNotificationId: "",
      aiSuggestions,
      contactId,
    };

    let updated: Quotation[];
    if (editingId) {
      updated = savedQuotations.map((q) => (q.id === editingId ? quotation : q));
    } else {
      updated = [quotation, ...savedQuotations].slice(0, 100);
    }
    setSavedQuotations(updated);
    localStorage.setItem("quotation_history", JSON.stringify(updated));
    setEditingId(quotation.id);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    return quotation;
  }, [
    editingId, referenceNumber, clientName, company, email, productService,
    lineItems, discountPercent, taxPercent, validUntil, notes, subtotal,
    discountAmount, taxAmount, total, aiEnhancement, savedQuotations,
    status, followUpDate, followUpTime, followUpNotes, aiSuggestions, contactId,
  ]);

  // ─── Create Follow-Up Ticket ──────────────────────────────────────────────

  const handleCreateTicket = async () => {
    if (!followUpDate || !clientName) return;
    setCreatingTicket(true);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/quotations/follow-up", {
        method: "POST",
        headers,
        body: JSON.stringify({
          referenceNumber,
          clientName,
          company,
          followUpDate: `${followUpDate}T${followUpTime || "09:00"}`,
          notes: followUpNotes || `Follow up on quotation ${referenceNumber}`,
          total,
          contactId: contactId || undefined,
        }),
      });

      if (res.ok) {
        setTicketCreated(true);
        setTimeout(() => setTicketCreated(false), 3000);
        // Auto-save
        saveQuotation();
      }
    } catch (err) {
      console.error("Failed to create ticket:", err);
    } finally {
      setCreatingTicket(false);
    }
  };

  // ─── Export PDF ────────────────────────────────────────────────────────────

  const handleExportPDF = () => {
    exportQuotationPDF({
      referenceNumber,
      clientName,
      company,
      email,
      productService,
      lineItems,
      subtotal,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      total,
      validUntil,
      notes,
      aiEnhancement,
      status: STATUS_CONFIG[status].label,
    });
    saveQuotation();
  };

  // ─── Email ─────────────────────────────────────────────────────────────────

  const handleSendEmail = async () => {
    if (!email.trim()) return;
    setSendingEmail(true);
    setEmailResult(null);
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/quotations/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: email,
          clientName,
          company,
          referenceNumber,
          productService,
          lineItems,
          subtotal,
          discountPercent,
          discountAmount,
          taxPercent,
          taxAmount,
          total,
          validUntil,
          notes,
          aiEnhancement,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailResult({ success: true, message: `Quotation sent to ${email}` });
        setStatus("sent");
        saveQuotation();
      } else {
        setEmailResult({ success: false, message: data.error || "Failed to send email" });
      }
    } catch (err) {
      setEmailResult({
        success: false,
        message: err instanceof Error ? err.message : "Network error — check your connection",
      });
    }
    setSendingEmail(false);
    // Auto-clear success message after 5s
    setTimeout(() => setEmailResult(null), 5000);
  };

  // ─── Copy ──────────────────────────────────────────────────────────────────

  const handleCopy = () => {
    navigator.clipboard.writeText(buildProposalText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Build text ────────────────────────────────────────────────────────────

  function buildProposalText(): string {
    let text = `QUOTATION ${referenceNumber}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    text += `Valid Until: ${validUntil}\n`;
    text += `Status: ${STATUS_CONFIG[status].label}\n\n`;
    text += `Prepared for:\n${clientName}\n${company}\n${email}\n\n`;
    text += `## Product / Service\n${productService}\n\n`;
    text += `## Line Items\n`;
    lineItems.forEach((item) => {
      if (item.description) {
        text += `- ${item.description}: ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.quantity * item.unitPrice)}\n`;
      }
    });
    text += `\n## Pricing Summary\n`;
    text += `Subtotal: ${formatCurrency(subtotal)}\n`;
    if (discountPercent > 0) text += `Discount (${discountPercent}%): -${formatCurrency(discountAmount)}\n`;
    if (taxPercent > 0) text += `Tax (${taxPercent}%): +${formatCurrency(taxAmount)}\n`;
    text += `**Total: ${formatCurrency(total)}**\n\n`;
    if (notes) text += `## Terms & Conditions\n${notes}\n\n`;
    if (aiEnhancement) text += `## Proposal Details\n${aiEnhancement}\n`;
    return text;
  }

  // ─── Load quotation from history ───────────────────────────────────────────

  const loadQuotation = (q: Quotation) => {
    setEditingId(q.id);
    setReferenceNumber(q.referenceNumber);
    setClientName(q.clientName);
    setCompany(q.company);
    setEmail(q.email);
    setProductService(q.productService);
    setLineItems(q.lineItems.length > 0 ? q.lineItems : [createLineItem()]);
    setDiscountPercent(q.discountPercent);
    setTaxPercent(q.taxPercent);
    setValidUntil(q.validUntil);
    setNotes(q.notes);
    setAiEnhancement(q.aiEnhancement);
    setStatus(q.status || "draft");
    setFollowUpDate(q.followUpDate || "");
    setFollowUpTime(q.followUpTime || "09:00");
    setFollowUpNotes(q.followUpNotes || "");
    setAiSuggestions(q.aiSuggestions || "");
    setContactId(q.contactId || "");
    setShowHistory(false);
  };

  // ─── Delete quotation from history ─────────────────────────────────────────

  const deleteQuotation = (id: string) => {
    const updated = savedQuotations.filter((q) => q.id !== id);
    setSavedQuotations(updated);
    localStorage.setItem("quotation_history", JSON.stringify(updated));
    if (editingId === id) setEditingId(null);
  };

  // ─── Update status on existing quotation ───────────────────────────────────

  const updateQuotationStatus = (id: string, newStatus: QuotationStatus) => {
    const updated = savedQuotations.map((q) =>
      q.id === id ? { ...q, status: newStatus } : q
    );
    setSavedQuotations(updated);
    localStorage.setItem("quotation_history", JSON.stringify(updated));
    if (editingId === id) setStatus(newStatus);
  };

  // ─── Reset form ────────────────────────────────────────────────────────────

  const resetForm = () => {
    setEditingId(null);
    setReferenceNumber(generateRefNumber());
    setClientName("");
    setCompany("");
    setEmail("");
    setProductService("");
    setLineItems([createLineItem()]);
    setDiscountPercent(0);
    setTaxPercent(0);
    setValidUntil(getDefaultValidDate());
    setNotes("Payment terms: Net 30 days.\nThis quotation is valid for the period specified above.");
    setAiEnhancement("");
    setAiSuggestions("");
    setStatus("draft");
    setFollowUpDate("");
    setFollowUpTime("09:00");
    setFollowUpNotes("");
    setContactId("");
  };

  // ─── Filtered history ─────────────────────────────────────────────────────

  const filteredHistory = savedQuotations.filter((q) => {
    if (historyStatusFilter !== "all" && (q.status || "draft") !== historyStatusFilter) return false;
    if (historySearch) {
      const s = historySearch.toLowerCase();
      return (
        q.referenceNumber.toLowerCase().includes(s) ||
        q.clientName.toLowerCase().includes(s) ||
        q.company.toLowerCase().includes(s) ||
        (q.productService || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* ─── Follow-Up Reminders Banner ──────────────────────────── */}
      {followUpReminders.length > 0 && (
        <div className="space-y-2">
          {followUpReminders.map((r) => {
            const fStatus = getFollowUpStatus(r.followUpDate, r.followUpTime);
            const isOverdue = fStatus === "overdue";
            return (
              <div
                key={r.id}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-lg border",
                  isOverdue
                    ? "bg-errorred/10 border-errorred/30"
                    : "bg-warningamber/10 border-warningamber/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <BellRing className={cn("h-5 w-5", isOverdue ? "text-errorred" : "text-warningamber")} />
                  <div>
                    <p className={cn("text-sm font-medium", isOverdue ? "text-errorred" : "text-warningamber")}>
                      {isOverdue ? "OVERDUE" : "DUE TODAY"}: Follow up on {r.referenceNumber}
                    </p>
                    <p className="text-xs text-silver">
                      {r.clientName} at {r.company} — {formatCurrency(r.total)} — {r.followUpDate} {r.followUpTime}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => loadQuotation(r)}
                  className={cn(
                    "gap-1",
                    isOverdue
                      ? "bg-errorred hover:bg-errorred/80 text-white"
                      : "bg-warningamber hover:bg-warningamber/80 text-black"
                  )}
                >
                  <Eye className="h-3 w-3" />
                  Open
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
            <FileText className="h-6 w-6 text-neonblue" />
            Quotation & Proposal Builder
          </h1>
          <p className="text-silver mt-1">
            Create professional quotations with AI-powered suggestions, track status, and set follow-up reminders
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Badge */}
          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium", STATUS_CONFIG[status].bgColor, STATUS_CONFIG[status].color)}>
            {(() => { const Icon = STATUS_CONFIG[status].icon; return <Icon className="h-3.5 w-3.5" />; })()}
            {STATUS_CONFIG[status].label}
          </div>
          <Badge className="bg-neonblue/15 text-neonblue border-neonblue/30 font-mono text-sm px-3 py-1">
            {referenceNumber}
          </Badge>
          {editingId && (
            <Badge className="bg-automationgreen/15 text-automationgreen border-automationgreen/30 text-xs">
              Editing
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="border-gunmetal text-silver hover:text-platinum gap-1"
          >
            <Clock className="h-4 w-4" />
            History ({savedQuotations.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetForm}
            className="border-gunmetal text-silver hover:text-platinum gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* ─── History Panel ────────────────────────────────────────── */}
      {showHistory && (
        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-platinum text-base">
                Saved Quotations ({filteredHistory.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mist" />
                  <Input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search quotations..."
                    className="bg-onyx border-gunmetal text-platinum text-xs h-8 pl-8 w-48"
                  />
                </div>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value as QuotationStatus | "all")}
                  className="bg-onyx border border-gunmetal text-platinum text-xs h-8 px-2 rounded-md"
                >
                  <option value="all">All Status</option>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredHistory.length === 0 ? (
              <p className="text-sm text-mist text-center py-4">No quotations found</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredHistory.map((q) => {
                  const qStatus = q.status || "draft";
                  const cfg = STATUS_CONFIG[qStatus];
                  const fStatus = q.followUpDate ? getFollowUpStatus(q.followUpDate, q.followUpTime) : "none";
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg bg-onyx border transition-colors",
                        editingId === q.id ? "border-neonblue" : "border-gunmetal hover:border-neonblue/40"
                      )}
                    >
                      <button onClick={() => loadQuotation(q)} className="flex-1 text-left">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-xs text-neonblue">{q.referenceNumber}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full", cfg.bgColor, cfg.color)}>
                            {cfg.label}
                          </span>
                          {fStatus === "overdue" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-errorred/10 text-errorred flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Overdue
                            </span>
                          )}
                          {fStatus === "due-today" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-warningamber/10 text-warningamber flex items-center gap-1">
                              <Bell className="h-3 w-3" /> Due Today
                            </span>
                          )}
                          <span className="text-sm text-platinum">
                            {q.clientName || "Untitled"} - {q.company || "N/A"}
                          </span>
                          <span className="text-sm font-semibold text-automationgreen">
                            {formatCurrency(q.total)}
                          </span>
                        </div>
                        <p className="text-xs text-mist mt-0.5">
                          {new Date(q.createdAt).toLocaleDateString()} — {q.productService || "No product specified"}
                          {q.followUpDate && ` — Follow-up: ${q.followUpDate}`}
                        </p>
                      </button>
                      <div className="flex items-center gap-1 ml-2">
                        {/* Quick status actions */}
                        {qStatus === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => updateQuotationStatus(q.id, "sent")}
                            className="text-neonblue hover:text-neonblue/80"
                            title="Mark as Sent"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        )}
                        {qStatus === "sent" && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => updateQuotationStatus(q.id, "accepted")}
                            className="text-automationgreen hover:text-automationgreen/80"
                            title="Mark as Accepted"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => deleteQuotation(q.id)}
                          className="text-mist hover:text-errorred"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ─── LEFT: Form ─────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Client Details */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-neonblue" />
                Client Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-silver mb-1.5">Client Name *</label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Smith"
                    className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                  />
                </div>
                <div>
                  <label className="block text-xs text-silver mb-1.5">Company *</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Corp"
                      className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-silver mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@acmecorp.com"
                      className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-silver mb-1.5">Valid Until</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <Input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="bg-onyx border-gunmetal text-platinum focus:border-neonblue pl-9"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-silver mb-1.5">Product / Service</label>
                <Input
                  value={productService}
                  onChange={(e) => setProductService(e.target.value)}
                  placeholder="e.g., Enterprise SaaS License, Consulting Package"
                  className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status & Follow-Up */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-neonblue" />
                Status & Follow-Up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-silver mb-1.5">Quotation Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as QuotationStatus)}
                    className="w-full bg-onyx border border-gunmetal text-platinum text-sm h-10 px-3 rounded-md focus:border-neonblue outline-none"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-silver mb-1.5">Follow-Up Date</label>
                  <div className="relative">
                    <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <Input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="bg-onyx border-gunmetal text-platinum focus:border-neonblue pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-silver mb-1.5">Follow-Up Time</label>
                  <Input
                    type="time"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="bg-onyx border-gunmetal text-platinum focus:border-neonblue"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-silver mb-1.5">Follow-Up Notes</label>
                <Input
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="e.g., Check if they reviewed the proposal, discuss pricing..."
                  className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                />
              </div>
              {followUpDate && (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleCreateTicket}
                    disabled={creatingTicket || !clientName}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    size="sm"
                  >
                    {creatingTicket ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : ticketCreated ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Ticket className="h-4 w-4" />
                    )}
                    {ticketCreated ? "Ticket Created!" : "Create Follow-Up Ticket"}
                  </Button>
                  {followUpDate && (
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      getFollowUpStatus(followUpDate, followUpTime) === "overdue"
                        ? "bg-errorred/10 text-errorred"
                        : getFollowUpStatus(followUpDate, followUpTime) === "due-today"
                        ? "bg-warningamber/10 text-warningamber"
                        : "bg-neonblue/10 text-neonblue"
                    )}>
                      {getFollowUpStatus(followUpDate, followUpTime) === "overdue"
                        ? "Overdue!"
                        : getFollowUpStatus(followUpDate, followUpTime) === "due-today"
                        ? "Due Today"
                        : `Scheduled: ${followUpDate}`}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-neonblue" />
                  Line Items
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                  className="border-neonblue/30 text-neonblue hover:bg-neonblue/10 gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-[1fr_80px_110px_100px_32px] gap-2 text-xs text-mist font-medium px-1">
                <span>Description</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Unit Price</span>
                <span className="text-right">Total</span>
                <span></span>
              </div>

              {lineItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_80px_110px_100px_32px] gap-2 items-center"
                >
                  <Input
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                    placeholder={`Item ${idx + 1}`}
                    className="bg-onyx border-gunmetal text-platinum placeholder:text-mist text-sm h-9"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-onyx border-gunmetal text-platinum text-sm text-center h-9"
                  />
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-mist" />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice || ""}
                      onChange={(e) => updateLineItem(item.id, "unitPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0.00"
                      className="bg-onyx border-gunmetal text-platinum text-sm text-right h-9 pl-6"
                    />
                  </div>
                  <span className="text-sm text-platinum text-right font-mono">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeLineItem(item.id)}
                    disabled={lineItems.length <= 1}
                    className="text-mist hover:text-errorred disabled:opacity-30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* Pricing Summary */}
              <div className="border-t border-gunmetal pt-4 mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-silver mb-1.5">Discount %</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={discountPercent || ""}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      placeholder="0"
                      className="bg-onyx border-gunmetal text-platinum text-sm h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-silver mb-1.5">Tax %</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={taxPercent || ""}
                      onChange={(e) => setTaxPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      placeholder="0"
                      className="bg-onyx border-gunmetal text-platinum text-sm h-9"
                    />
                  </div>
                </div>

                <div className="bg-onyx rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm text-silver">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-sm text-warningamber">
                      <span>Discount ({discountPercent}%)</span>
                      <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {taxPercent > 0 && (
                    <div className="flex justify-between text-sm text-silver">
                      <span>Tax ({taxPercent}%)</span>
                      <span className="font-mono">+{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gunmetal pt-2 mt-2 flex justify-between text-base font-bold">
                    <span className="text-platinum">Total</span>
                    <span className="text-automationgreen font-mono">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes / Terms */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-neonblue" />
                Notes & Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, delivery conditions, warranties..."
                className="min-h-[100px] bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue text-sm"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => { saveQuotation(); }}
              className={cn(
                "gap-2",
                justSaved
                  ? "bg-automationgreen hover:bg-automationgreen/80 text-white"
                  : "bg-neonblue/20 hover:bg-neonblue/30 text-neonblue border border-neonblue/30"
              )}
            >
              {justSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {justSaved ? "Saved!" : "Save Quotation"}
            </Button>
            <Button
              onClick={handleGenerateWithAI}
              disabled={isGenerating || (!clientName.trim() && !productService.trim())}
              className="bg-neonblue hover:bg-electricblue text-white gap-2"
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> AI Proposal</>
              )}
            </Button>
            <Button
              onClick={handleGetSuggestions}
              disabled={isSuggesting}
              variant="outline"
              className="border-warningamber/30 text-warningamber hover:bg-warningamber/10 gap-2"
            >
              {isSuggesting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Lightbulb className="h-4 w-4" /> AI Suggestions</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="border-gunmetal text-silver hover:text-platinum gap-2"
            >
              {showPreview ? <><EyeOff className="h-4 w-4" /> Hide Preview</> : <><Eye className="h-4 w-4" /> Preview</>}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={!clientName.trim()}
              className="border-gunmetal text-silver hover:text-platinum gap-2"
            >
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleSendEmail}
              disabled={!email.trim() || sendingEmail}
              className="border-gunmetal text-silver hover:text-platinum gap-2"
            >
              {sendingEmail ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Mail className="h-4 w-4" /> Send Email</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopy}
              className="border-gunmetal text-silver hover:text-platinum gap-2"
            >
              {copied ? <><Check className="h-4 w-4 text-automationgreen" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
            </Button>
          </div>
          {/* Email send result */}
          {emailResult && (
            <div className={cn(
              "p-3 rounded-lg text-sm mt-2",
              emailResult.success
                ? "bg-automationgreen/10 text-automationgreen border border-automationgreen/20"
                : "bg-errorred/10 text-errorred border border-errorred/20"
            )}>
              {emailResult.success ? <CheckCircle2 className="h-4 w-4 inline mr-1.5" /> : <AlertTriangle className="h-4 w-4 inline mr-1.5" />}
              {emailResult.message}
            </div>
          )}
        </div>

        {/* ─── RIGHT: AI Suggestions + Preview + AI Enhancement ──── */}
        <div className="space-y-6">
          {/* AI Smart Suggestions */}
          {(aiSuggestions || isSuggesting) && (
            <Card className="bg-graphite border-warningamber/20">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-warningamber" />
                  AI Smart Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm max-w-none max-h-[400px] overflow-y-auto prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-warningamber prose-li:text-gray-200 prose-a:text-neonblue">
                  {aiSuggestions ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiSuggestions}</ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-2 text-mist">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing your quotation...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quotation Preview */}
          {showPreview && (
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4 text-neonblue" />
                  Quotation Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={previewRef}
                  className="bg-white rounded-lg p-6 text-gray-900 space-y-4 max-h-[600px] overflow-y-auto"
                >
                  {/* Preview Header */}
                  <div className="border-b-2 border-blue-600 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold text-blue-700">QUOTATION</h2>
                        <p className="text-sm text-gray-500 font-mono">{referenceNumber}</p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>Date: {new Date().toLocaleDateString()}</p>
                        <p>Valid Until: {validUntil}</p>
                        <p className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1",
                          status === "accepted" ? "bg-green-100 text-green-700"
                            : status === "rejected" ? "bg-red-100 text-red-700"
                            : status === "sent" ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        )}>
                          {STATUS_CONFIG[status].label}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prepared For</p>
                    <p className="font-semibold text-gray-800">{clientName || "Client Name"}</p>
                    <p className="text-sm text-gray-600">{company || "Company"}</p>
                    {email && <p className="text-sm text-gray-500">{email}</p>}
                  </div>

                  {/* Product */}
                  {productService && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">Product / Service</h3>
                      <p className="text-sm text-gray-600">{productService}</p>
                    </div>
                  )}

                  {/* Line Items Table */}
                  <div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 text-gray-600 font-medium">Description</th>
                          <th className="text-center py-2 text-gray-600 font-medium w-16">Qty</th>
                          <th className="text-right py-2 text-gray-600 font-medium w-24">Unit Price</th>
                          <th className="text-right py-2 text-gray-600 font-medium w-24">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems
                          .filter((i) => i.description)
                          .map((item) => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="py-2 text-gray-800">{item.description}</td>
                              <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                              <td className="py-2 text-right text-gray-600 font-mono">{formatCurrency(item.unitPrice)}</td>
                              <td className="py-2 text-right text-gray-800 font-mono font-medium">
                                {formatCurrency(item.quantity * item.unitPrice)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="bg-gray-50 rounded p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-mono text-gray-800">{formatCurrency(subtotal)}</span>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600">Discount ({discountPercent}%)</span>
                        <span className="font-mono text-orange-600">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    {taxPercent > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax ({taxPercent}%)</span>
                        <span className="font-mono text-gray-600">+{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-2 mt-2">
                      <span className="text-gray-900">Total</span>
                      <span className="text-blue-700 font-mono">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Follow-Up */}
                  {followUpDate && (
                    <div className="bg-blue-50 rounded p-3">
                      <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Follow-Up Scheduled</p>
                      <p className="text-sm text-blue-800 font-medium">{followUpDate} at {followUpTime}</p>
                      {followUpNotes && <p className="text-xs text-blue-600 mt-1">{followUpNotes}</p>}
                    </div>
                  )}

                  {/* Notes */}
                  {notes && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Terms & Conditions</h3>
                      <p className="text-xs text-gray-500 whitespace-pre-line">{notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Enhancement */}
          {(aiEnhancement || isGenerating) && (
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-warningamber" />
                  AI-Enhanced Proposal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm max-w-none max-h-[500px] overflow-y-auto prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-a:text-neonblue prose-code:text-automationgreen prose-blockquote:text-gray-300 prose-blockquote:border-neonblue/50">
                  {aiEnhancement ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiEnhancement}</ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-2 text-mist">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating professional proposal...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Tips (shown when nothing else is visible on right) */}
          {!showPreview && !aiEnhancement && !isGenerating && !aiSuggestions && !isSuggesting && (
            <Card className="bg-onyx border-gunmetal">
              <CardContent className="p-5">
                <h4 className="font-medium text-platinum mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-neonblue" />
                  How to Use
                </h4>
                <ul className="space-y-2.5 text-sm text-silver">
                  <li className="flex items-start gap-2">
                    <span className="text-neonblue mt-0.5">1.</span>
                    <span>Fill in client details and add line items with pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neonblue mt-0.5">2.</span>
                    <span>Click <strong className="text-warningamber">AI Suggestions</strong> for smart pricing and strategy tips</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neonblue mt-0.5">3.</span>
                    <span>Click <strong className="text-neonblue">AI Proposal</strong> to generate a polished professional proposal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neonblue mt-0.5">4.</span>
                    <span>Set a <strong className="text-purple-400">follow-up date</strong> and create a ticket to get reminded</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neonblue mt-0.5">5.</span>
                    <span>Export as PDF, send via email, or track status changes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neonblue mt-0.5">6.</span>
                    <span>All quotations are auto-saved with full history and search</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-graphite rounded-lg border border-gunmetal">
                  <p className="text-xs text-mist">
                    <strong className="text-silver">Pro tip:</strong> Set follow-up dates on every quotation.
                    You&apos;ll get a browser notification and in-app reminder when it&apos;s time to follow up.
                    Click &quot;Create Follow-Up Ticket&quot; to add it to your notification center.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense>
      <QuotationsPageInner />
    </Suspense>
  );
}
