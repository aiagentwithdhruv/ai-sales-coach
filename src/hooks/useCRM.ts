"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuthToken } from "@/lib/auth-token";
import type {
  Contact,
  ContactCreateInput,
  ContactUpdateInput,
  ContactFilters,
  PipelineStats,
  PipelineAnalytics,
  DealForecast,
  CRMNotification,
  DealStage,
  Activity,
  BulkAction,
} from "@/types/crm";

interface CRMState {
  contacts: Contact[];
  totalContacts: number;
  pipeline: Record<string, Contact[]>;
  stats: PipelineStats | null;
  isLoading: boolean;
  error: string | null;
}

const API_BASE = "/api/contacts";

async function authFetch(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export function useCRM(initialFilters?: ContactFilters) {
  const [state, setState] = useState<CRMState>({
    contacts: [],
    totalContacts: 0,
    pipeline: {},
    stats: null,
    isLoading: true,
    error: null,
  });
  const [filters, setFilters] = useState<ContactFilters>(
    initialFilters || { sortBy: "created_at", sortOrder: "desc", limit: 50 }
  );

  // Fetch contacts list
  const fetchContacts = useCallback(async (f?: ContactFilters) => {
    const activeFilters = f || filters;
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const params = new URLSearchParams();
      if (activeFilters.search) params.set("search", activeFilters.search);
      if (activeFilters.stage && activeFilters.stage !== "all")
        params.set("stage", activeFilters.stage);
      if (activeFilters.sortBy) params.set("sortBy", activeFilters.sortBy);
      if (activeFilters.sortOrder)
        params.set("sortOrder", activeFilters.sortOrder);
      if (activeFilters.page) params.set("page", String(activeFilters.page));
      if (activeFilters.limit) params.set("limit", String(activeFilters.limit));

      const res = await authFetch(`${API_BASE}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        contacts: data.contacts,
        totalContacts: data.total,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [filters]);

  // Fetch pipeline view
  const fetchPipeline = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const res = await authFetch(`${API_BASE}/pipeline`);
      if (!res.ok) throw new Error("Failed to fetch pipeline");
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        pipeline: data.stages,
        stats: data.stats,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, []);

  // Create contact
  const createContact = useCallback(
    async (input: ContactCreateInput): Promise<Contact | null> => {
      try {
        const res = await authFetch(API_BASE, {
          method: "POST",
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create contact");
        }
        const contact = await res.json();
        // Refresh list
        fetchContacts();
        return contact;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        return null;
      }
    },
    [fetchContacts]
  );

  // Update contact
  const updateContact = useCallback(
    async (id: string, input: ContactUpdateInput): Promise<Contact | null> => {
      try {
        const res = await authFetch(`${API_BASE}/${id}`, {
          method: "PUT",
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update contact");
        }
        const contact = await res.json();
        setState((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) => (c.id === id ? contact : c)),
        }));
        return contact;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        return null;
      }
    },
    []
  );

  // Delete contact
  const deleteContact = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await authFetch(`${API_BASE}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete contact");
        setState((prev) => ({
          ...prev,
          contacts: prev.contacts.filter((c) => c.id !== id),
          totalContacts: prev.totalContacts - 1,
        }));
        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        return false;
      }
    },
    []
  );

  // Change deal stage
  const changeStage = useCallback(
    async (id: string, stage: DealStage): Promise<Contact | null> => {
      try {
        const res = await authFetch(`${API_BASE}/${id}/stage`, {
          method: "PUT",
          body: JSON.stringify({ stage }),
        });
        if (!res.ok) throw new Error("Failed to update stage");
        const contact = await res.json();
        setState((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) => (c.id === id ? contact : c)),
        }));
        return contact;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        return null;
      }
    },
    []
  );

  // Enrich contact
  const enrichContact = useCallback(
    async (id: string): Promise<Contact | null> => {
      try {
        const res = await authFetch(`${API_BASE}/${id}/enrich`, {
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Enrichment failed");
        }
        const contact = await res.json();
        setState((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) => (c.id === id ? contact : c)),
        }));
        return contact;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        return null;
      }
    },
    []
  );

  // Get follow-up suggestion
  const suggestFollowUp = useCallback(
    async (
      id: string
    ): Promise<{
      urgency: string;
      reason: string;
      suggested_action: string;
      suggested_channel: string;
      draft_message: string;
    } | null> => {
      try {
        const res = await authFetch(`${API_BASE}/${id}/suggest-followup`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to get suggestion");
        }
        return await res.json();
      } catch {
        return null;
      }
    },
    []
  );

  // Import contacts
  const importContacts = useCallback(
    async (
      contacts: ContactCreateInput[]
    ): Promise<{ imported: number; skipped: number; errors: number } | null> => {
      try {
        const res = await authFetch(`${API_BASE}/import`, {
          method: "POST",
          body: JSON.stringify({ contacts }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Import failed");
        }
        const result = await res.json();
        fetchContacts();
        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        return null;
      }
    },
    [fetchContacts]
  );

  // Log activity
  const logActivity = useCallback(
    async (
      contactId: string,
      type: string,
      title: string,
      description?: string
    ): Promise<Activity | null> => {
      try {
        const res = await authFetch(`${API_BASE}/${contactId}/activities`, {
          method: "POST",
          body: JSON.stringify({ type, title, description }),
        });
        if (!res.ok) throw new Error("Failed to log activity");
        return await res.json();
      } catch {
        return null;
      }
    },
    []
  );

  // Get contact details
  const getContact = useCallback(
    async (
      id: string
    ): Promise<{ contact: Contact; activities: Activity[] } | null> => {
      try {
        const res = await authFetch(`${API_BASE}/${id}`);
        if (!res.ok) throw new Error("Failed to fetch contact");
        return await res.json();
      } catch {
        return null;
      }
    },
    []
  );

  // Bulk action
  const bulkAction = useCallback(
    async (action: BulkAction): Promise<{ success: boolean; affected: number }> => {
      try {
        const res = await authFetch(`${API_BASE}/bulk`, {
          method: "POST",
          body: JSON.stringify(action),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Bulk action failed");
        }
        const result = await res.json();
        fetchContacts();
        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        return { success: false, affected: 0 };
      }
    },
    [fetchContacts]
  );

  // Fetch analytics
  const fetchAnalytics = useCallback(
    async (): Promise<PipelineAnalytics | null> => {
      try {
        const res = await authFetch(`${API_BASE}/analytics`);
        if (!res.ok) throw new Error("Failed to fetch analytics");
        return await res.json();
      } catch {
        return null;
      }
    },
    []
  );

  // Fetch forecast
  const fetchForecast = useCallback(
    async (): Promise<DealForecast | null> => {
      try {
        const res = await authFetch(`${API_BASE}/forecast`);
        if (!res.ok) throw new Error("Failed to fetch forecast");
        return await res.json();
      } catch {
        return null;
      }
    },
    []
  );

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (
      unreadOnly = false
    ): Promise<{ notifications: CRMNotification[]; unreadCount: number }> => {
      try {
        const params = new URLSearchParams();
        if (unreadOnly) params.set("unreadOnly", "true");
        const res = await authFetch(`${API_BASE}/notifications?${params}`);
        if (!res.ok) throw new Error("Failed to fetch notifications");
        return await res.json();
      } catch {
        return { notifications: [], unreadCount: 0 };
      }
    },
    []
  );

  // Generate smart notifications
  const generateNotifications = useCallback(async (): Promise<number> => {
    try {
      const res = await authFetch(`${API_BASE}/notifications`, {
        method: "POST",
        body: JSON.stringify({ action: "generate" }),
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.generated || 0;
    } catch {
      return 0;
    }
  }, []);

  // Mark all notifications read
  const markAllNotificationsRead = useCallback(async (): Promise<boolean> => {
    try {
      const res = await authFetch(`${API_BASE}/notifications`, {
        method: "POST",
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // Mark single notification read
  const markNotificationRead = useCallback(
    async (notificationId: string): Promise<boolean> => {
      try {
        const res = await authFetch(
          `${API_BASE}/notifications/${notificationId}`,
          {
            method: "PUT",
            body: JSON.stringify({ action: "read" }),
          }
        );
        return res.ok;
      } catch {
        return false;
      }
    },
    []
  );

  // Dismiss notification
  const dismissNotification = useCallback(
    async (notificationId: string): Promise<boolean> => {
      try {
        const res = await authFetch(
          `${API_BASE}/notifications/${notificationId}`,
          {
            method: "PUT",
            body: JSON.stringify({ action: "dismiss" }),
          }
        );
        return res.ok;
      } catch {
        return false;
      }
    },
    []
  );

  // Update filters and refetch
  const updateFilters = useCallback(
    (newFilters: Partial<ContactFilters>) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      fetchContacts(updated);
    },
    [filters, fetchContacts]
  );

  // Initial fetch
  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    ...state,
    filters,
    updateFilters,
    fetchContacts,
    fetchPipeline,
    createContact,
    updateContact,
    deleteContact,
    changeStage,
    enrichContact,
    suggestFollowUp,
    importContacts,
    logActivity,
    getContact,
    bulkAction,
    fetchAnalytics,
    fetchForecast,
    fetchNotifications,
    generateNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    dismissNotification,
  };
}
