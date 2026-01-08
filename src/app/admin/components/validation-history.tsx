"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  User,
} from "lucide-react";
import Link from "next/link";

interface HistoryItem {
  id: string;
  status: string;
  installCommand: string | null;
  isOwnerSubmission: boolean;
  createdAt: string;
  validationResult: Record<string, unknown> | null;
  validationError: string | null;
  server: {
    id: string;
    name: string;
    slug: string;
    packageName: string | null;
    installCommand: string | null;
  };
  user: {
    username: string | null;
    avatar: string | null;
  };
}

export function ValidationHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"completed" | "failed">("completed");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/validate/queue?status=${filter}&limit=50`);
      const json = await res.json();
      setItems(json.data || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRetry = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/validate/${id}/retry`, { method: "POST" });
      await fetchHistory();
    } catch (error) {
      console.error("Failed to retry:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
          className={
            filter === "completed" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""
          }
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Completed
        </Button>
        <Button
          variant={filter === "failed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("failed")}
          className={
            filter === "failed" ? "bg-red-500/20 text-red-400 border-red-500/30" : ""
          }
        >
          <XCircle className="w-4 h-4 mr-1" />
          Failed
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchHistory()}
          className="ml-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No {filter} validations found
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-[var(--glass-subtle)] border border-[var(--glass-border)] overflow-hidden"
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--glass-elevated)] transition-colors"
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/servers/${item.server.slug}`}
                      className="font-medium hover:text-cyan transition-colors truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.server.name}
                    </Link>
                    {item.status === "completed" ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {item.user.username && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.user.username}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === "failed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry(item.id);
                      }}
                      disabled={actionLoading === item.id}
                      className="text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
                    >
                      {actionLoading === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Link
                    href={`/servers/${item.server.slug}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  {expandedId === item.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedId === item.id && (
                <div className="border-t border-[var(--glass-border)] p-4 bg-black/20">
                  {item.validationError && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-red-400 mb-2">
                        Error
                      </h4>
                      <pre className="text-xs bg-black/30 p-3 rounded-lg overflow-x-auto text-red-300">
                        {item.validationError}
                      </pre>
                    </div>
                  )}

                  {item.validationResult && (
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-2">
                        Result
                      </h4>
                      <pre className="text-xs bg-black/30 p-3 rounded-lg overflow-x-auto text-muted-foreground">
                        {JSON.stringify(item.validationResult, null, 2)}
                      </pre>
                    </div>
                  )}

                  {!item.validationError && !item.validationResult && (
                    <p className="text-sm text-muted-foreground">
                      No additional details available
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
