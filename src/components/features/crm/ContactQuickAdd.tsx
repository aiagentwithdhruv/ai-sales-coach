"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVE_STAGES, STAGE_CONFIG, type DealStage } from "@/types/crm";
import type { ContactCreateInput } from "@/types/crm";
import { UserPlus, Sparkles, Loader2 } from "lucide-react";

interface ContactQuickAddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ContactCreateInput) => Promise<unknown>;
  onEnrich?: (contactId: string) => Promise<unknown>;
}

export function ContactQuickAdd({
  open,
  onOpenChange,
  onSubmit,
  onEnrich,
}: ContactQuickAddProps) {
  const [form, setForm] = useState<ContactCreateInput>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    deal_stage: "new",
    tags: [],
  });
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const reset = () => {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company: "",
      deal_stage: "new",
      tags: [],
    });
    setTagInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim()) return;
    setSaving(true);
    const result = await onSubmit(form);
    setSaving(false);
    if (result) {
      const contact = result as { id: string };
      reset();
      onOpenChange(false);
      // Offer enrichment
      if (onEnrich && contact.id) {
        onEnrich(contact.id);
      }
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags?.includes(tag)) {
      setForm({ ...form, tags: [...(form.tags || []), tag] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags?.filter((t) => t !== tag) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-onyx border-gunmetal sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-platinum flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-neonblue" />
            Add Contact
          </DialogTitle>
          <DialogDescription className="text-silver">
            Add a new contact to your pipeline. Only first name is required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-mist mb-1 block">
                First Name *
              </label>
              <Input
                placeholder="John"
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                className="bg-graphite border-gunmetal text-platinum"
                required
              />
            </div>
            <div>
              <label className="text-xs text-mist mb-1 block">Last Name</label>
              <Input
                placeholder="Doe"
                value={form.last_name || ""}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                className="bg-graphite border-gunmetal text-platinum"
              />
            </div>
          </div>

          {/* Email / Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-mist mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-graphite border-gunmetal text-platinum"
              />
            </div>
            <div>
              <label className="text-xs text-mist mb-1 block">Phone</label>
              <Input
                placeholder="+1 555-0123"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-graphite border-gunmetal text-platinum"
              />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="text-xs text-mist mb-1 block">Company</label>
            <Input
              placeholder="Acme Inc."
              value={form.company || ""}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="bg-graphite border-gunmetal text-platinum"
            />
          </div>

          {/* Stage + Deal Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-mist mb-1 block">Stage</label>
              <Select
                value={form.deal_stage || "new"}
                onValueChange={(v) =>
                  setForm({ ...form, deal_stage: v as DealStage })
                }
              >
                <SelectTrigger className="bg-graphite border-gunmetal text-platinum">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-graphite border-gunmetal">
                  {ACTIVE_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      <span className={STAGE_CONFIG[stage].color}>
                        {STAGE_CONFIG[stage].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-mist mb-1 block">
                Deal Value ($)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={form.deal_value || ""}
                onChange={(e) =>
                  setForm({ ...form, deal_value: Number(e.target.value) })
                }
                className="bg-graphite border-gunmetal text-platinum"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-mist mb-1 block">Tags</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="bg-graphite border-gunmetal text-platinum"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                className="border-gunmetal text-silver hover:text-platinum"
              >
                Add
              </Button>
            </div>
            {form.tags && form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neonblue/10 text-neonblue text-xs cursor-pointer hover:bg-errorred/10 hover:text-errorred transition-colors"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} &times;
                  </span>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              className="border-gunmetal text-silver"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.first_name.trim() || saving}
              className="bg-neonblue hover:bg-electricblue text-white"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Add Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
