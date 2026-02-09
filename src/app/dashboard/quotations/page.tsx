"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { exportToPDF } from "@/lib/export-pdf";
import { getAuthToken } from "@/hooks/useCredits";
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
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateRefNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `QUO-${year}-${seq}`;
}

function createLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuotationsPage() {
  // Form state
  const [referenceNumber] = useState(generateRefNumber);
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

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [aiEnhancement, setAiEnhancement] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedQuotations, setSavedQuotations] = useState<Quotation[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("quotation_history");
      if (stored) {
        setSavedQuotations(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // ─── Calculations ──────────────────────────────────────────────────────────

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxPercent / 100);
  const total = taxableAmount + taxAmount;

  // ─── Line Items ────────────────────────────────────────────────────────────

  const addLineItem = () => {
    setLineItems((prev) => [...prev, createLineItem()]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateLineItem = (
    id: string,
    field: keyof Omit<LineItem, "id">,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
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
  .map(
    (i) =>
      `  - ${i.description}: ${i.quantity} x ${formatCurrency(i.unitPrice)} = ${formatCurrency(i.quantity * i.unitPrice)}`
  )
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
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: prompt,
          model:
            localStorage.getItem("ai_model") ||
            "claude-sonnet-4-5-20250929",
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Handle both plain text and data stream formats
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const text = JSON.parse(line.slice(2));
                fullText += text;
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
      setAiEnhancement(
        "Failed to generate AI enhancement. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Save ──────────────────────────────────────────────────────────────────

  const saveQuotation = useCallback(() => {
    const quotation: Quotation = {
      id: crypto.randomUUID(),
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
      createdAt: new Date().toISOString(),
    };

    const updated = [quotation, ...savedQuotations].slice(0, 50);
    setSavedQuotations(updated);
    localStorage.setItem("quotation_history", JSON.stringify(updated));
    return quotation;
  }, [
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
    discountAmount,
    taxAmount,
    total,
    aiEnhancement,
    savedQuotations,
  ]);

  // ─── Export PDF ────────────────────────────────────────────────────────────

  const handleExportPDF = () => {
    const content = buildProposalText();
    exportToPDF({
      title: `Quotation ${referenceNumber}`,
      subtitle: `Prepared for ${clientName} at ${company}`,
      content,
      metadata: {
        Reference: referenceNumber,
        Date: new Date().toLocaleDateString(),
        "Valid Until": validUntil,
        Client: `${clientName} (${email})`,
      },
    });
    saveQuotation();
  };

  // ─── Email ─────────────────────────────────────────────────────────────────

  const handleSendEmail = () => {
    const subject = encodeURIComponent(
      `Quotation ${referenceNumber} - ${productService}`
    );
    const body = encodeURIComponent(buildProposalText());
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    saveQuotation();
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
    text += `Valid Until: ${validUntil}\n\n`;
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
    if (discountPercent > 0)
      text += `Discount (${discountPercent}%): -${formatCurrency(discountAmount)}\n`;
    if (taxPercent > 0)
      text += `Tax (${taxPercent}%): +${formatCurrency(taxAmount)}\n`;
    text += `**Total: ${formatCurrency(total)}**\n\n`;
    if (notes) text += `## Terms & Conditions\n${notes}\n\n`;
    if (aiEnhancement) text += `## Proposal Details\n${aiEnhancement}\n`;
    return text;
  }

  // ─── Load quotation from history ───────────────────────────────────────────

  const loadQuotation = (q: Quotation) => {
    setClientName(q.clientName);
    setCompany(q.company);
    setEmail(q.email);
    setProductService(q.productService);
    setLineItems(
      q.lineItems.length > 0 ? q.lineItems : [createLineItem()]
    );
    setDiscountPercent(q.discountPercent);
    setTaxPercent(q.taxPercent);
    setValidUntil(q.validUntil);
    setNotes(q.notes);
    setAiEnhancement(q.aiEnhancement);
    setShowHistory(false);
  };

  // ─── Delete quotation from history ─────────────────────────────────────────

  const deleteQuotation = (id: string) => {
    const updated = savedQuotations.filter((q) => q.id !== id);
    setSavedQuotations(updated);
    localStorage.setItem("quotation_history", JSON.stringify(updated));
  };

  // ─── Reset form ────────────────────────────────────────────────────────────

  const resetForm = () => {
    setClientName("");
    setCompany("");
    setEmail("");
    setProductService("");
    setLineItems([createLineItem()]);
    setDiscountPercent(0);
    setTaxPercent(0);
    setValidUntil(getDefaultValidDate());
    setNotes(
      "Payment terms: Net 30 days.\nThis quotation is valid for the period specified above."
    );
    setAiEnhancement("");
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
            <FileText className="h-6 w-6 text-neonblue" />
            Quotation / Proposal Generator
          </h1>
          <p className="text-silver mt-1">
            Create professional quotations and AI-enhanced proposals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-neonblue/15 text-neonblue border-neonblue/30 font-mono text-sm px-3 py-1">
            {referenceNumber}
          </Badge>
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
            Reset
          </Button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && savedQuotations.length > 0 && (
        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum text-base">
              Quotation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedQuotations.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-onyx border border-gunmetal hover:border-neonblue/40 transition-colors"
                >
                  <button
                    onClick={() => loadQuotation(q)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-neonblue">
                        {q.referenceNumber}
                      </span>
                      <span className="text-sm text-platinum">
                        {q.clientName || "Untitled"} - {q.company || "N/A"}
                      </span>
                      <span className="text-sm font-semibold text-automationgreen">
                        {formatCurrency(q.total)}
                      </span>
                    </div>
                    <p className="text-xs text-mist mt-0.5">
                      {new Date(q.createdAt).toLocaleDateString()} -{" "}
                      {q.productService || "No product specified"}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteQuotation(q.id)}
                    className="text-mist hover:text-errorred ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
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
                  <label className="block text-xs text-silver mb-1.5">
                    Client Name *
                  </label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Smith"
                    className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                  />
                </div>
                <div>
                  <label className="block text-xs text-silver mb-1.5">
                    Company *
                  </label>
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
                  <label className="block text-xs text-silver mb-1.5">
                    Email
                  </label>
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
                  <label className="block text-xs text-silver mb-1.5">
                    Valid Until
                  </label>
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
                <label className="block text-xs text-silver mb-1.5">
                  Product / Service
                </label>
                <Input
                  value={productService}
                  onChange={(e) => setProductService(e.target.value)}
                  placeholder="e.g., Enterprise SaaS License, Consulting Package"
                  className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                />
              </div>
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
              {/* Header row */}
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
                    onChange={(e) =>
                      updateLineItem(item.id, "description", e.target.value)
                    }
                    placeholder={`Item ${idx + 1}`}
                    className="bg-onyx border-gunmetal text-platinum placeholder:text-mist text-sm h-9"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(
                        item.id,
                        "quantity",
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                    className="bg-onyx border-gunmetal text-platinum text-sm text-center h-9"
                  />
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-mist" />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        updateLineItem(
                          item.id,
                          "unitPrice",
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
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
                    <label className="block text-xs text-silver mb-1.5">
                      Discount %
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={discountPercent || ""}
                      onChange={(e) =>
                        setDiscountPercent(
                          Math.min(
                            100,
                            Math.max(0, parseFloat(e.target.value) || 0)
                          )
                        )
                      }
                      placeholder="0"
                      className="bg-onyx border-gunmetal text-platinum text-sm h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-silver mb-1.5">
                      Tax %
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={taxPercent || ""}
                      onChange={(e) =>
                        setTaxPercent(
                          Math.min(
                            100,
                            Math.max(0, parseFloat(e.target.value) || 0)
                          )
                        )
                      }
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
                      <span className="font-mono">
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                  )}
                  {taxPercent > 0 && (
                    <div className="flex justify-between text-sm text-silver">
                      <span>Tax ({taxPercent}%)</span>
                      <span className="font-mono">
                        +{formatCurrency(taxAmount)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gunmetal pt-2 mt-2 flex justify-between text-base font-bold">
                    <span className="text-platinum">Total</span>
                    <span className="text-automationgreen font-mono">
                      {formatCurrency(total)}
                    </span>
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
              onClick={handleGenerateWithAI}
              disabled={isGenerating || (!clientName.trim() && !productService.trim())}
              className="bg-neonblue hover:bg-electricblue text-white gap-2 flex-1 sm:flex-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="border-gunmetal text-silver hover:text-platinum gap-2"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show Preview
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={!clientName.trim()}
              className="border-gunmetal text-silver hover:text-platinum gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleSendEmail}
              disabled={!email.trim()}
              className="border-gunmetal text-silver hover:text-platinum gap-2"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
            <Button
              variant="outline"
              onClick={handleCopy}
              className="border-gunmetal text-silver hover:text-platinum gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-automationgreen" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ─── RIGHT: Preview & AI Enhancement ────────────────────── */}
        <div className="space-y-6">
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
                        <h2 className="text-xl font-bold text-blue-700">
                          QUOTATION
                        </h2>
                        <p className="text-sm text-gray-500 font-mono">
                          {referenceNumber}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>
                          Date: {new Date().toLocaleDateString()}
                        </p>
                        <p>Valid Until: {validUntil}</p>
                      </div>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Prepared For
                    </p>
                    <p className="font-semibold text-gray-800">
                      {clientName || "Client Name"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {company || "Company"}
                    </p>
                    {email && (
                      <p className="text-sm text-gray-500">{email}</p>
                    )}
                  </div>

                  {/* Product */}
                  {productService && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
                        Product / Service
                      </h3>
                      <p className="text-sm text-gray-600">
                        {productService}
                      </p>
                    </div>
                  )}

                  {/* Line Items Table */}
                  <div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 text-gray-600 font-medium">
                            Description
                          </th>
                          <th className="text-center py-2 text-gray-600 font-medium w-16">
                            Qty
                          </th>
                          <th className="text-right py-2 text-gray-600 font-medium w-24">
                            Unit Price
                          </th>
                          <th className="text-right py-2 text-gray-600 font-medium w-24">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems
                          .filter((i) => i.description)
                          .map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-gray-100"
                            >
                              <td className="py-2 text-gray-800">
                                {item.description}
                              </td>
                              <td className="py-2 text-center text-gray-600">
                                {item.quantity}
                              </td>
                              <td className="py-2 text-right text-gray-600 font-mono">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="py-2 text-right text-gray-800 font-mono font-medium">
                                {formatCurrency(
                                  item.quantity * item.unitPrice
                                )}
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
                      <span className="font-mono text-gray-800">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600">
                          Discount ({discountPercent}%)
                        </span>
                        <span className="font-mono text-orange-600">
                          -{formatCurrency(discountAmount)}
                        </span>
                      </div>
                    )}
                    {taxPercent > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Tax ({taxPercent}%)
                        </span>
                        <span className="font-mono text-gray-600">
                          +{formatCurrency(taxAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-2 mt-2">
                      <span className="text-gray-900">Total</span>
                      <span className="text-blue-700 font-mono">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {notes && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Terms & Conditions
                      </h3>
                      <p className="text-xs text-gray-500 whitespace-pre-line">
                        {notes}
                      </p>
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {aiEnhancement}
                    </ReactMarkdown>
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

          {/* Quick Tips */}
          {!showPreview && !aiEnhancement && !isGenerating && (
            <Card className="bg-onyx border-gunmetal">
              <CardContent className="p-5">
                <h4 className="font-medium text-platinum mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-neonblue" />
                  Proposal Tips
                </h4>
                <ul className="space-y-2.5 text-sm text-silver">
                  <li className="flex items-start gap-2">
                    <span className="text-neonblue mt-0.5">1.</span>
                    <span>
                      Fill in client details and line items first
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neonblue mt-0.5">2.</span>
                    <span>
                      Click &quot;Generate with AI&quot; to create a professional proposal
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neonblue mt-0.5">3.</span>
                    <span>
                      Preview the formatted quotation before sending
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neonblue mt-0.5">4.</span>
                    <span>
                      Export as PDF or send directly via email
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neonblue mt-0.5">5.</span>
                    <span>
                      All quotations are auto-saved to history
                    </span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-graphite rounded-lg border border-gunmetal">
                  <p className="text-xs text-mist">
                    The AI will enhance your quotation with professional
                    language, value propositions for each item, and compelling
                    terms. Make sure to fill in as many details as possible for
                    the best results.
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
