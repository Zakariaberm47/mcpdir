"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  User,
  Clock,
  Loader2,
  Crown,
} from "lucide-react";
import Link from "next/link";

interface QueueItem {
  id: string;
  status: string;
  installCommand: string | null;
  isOwnerSubmission: boolean;
  createdAt: string;
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

export function ValidationQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  const fetchQueue = useCallback(async () => {
    try {
      const url = filter
        ? `/api/validate/queue?status=${filter}`
        : "/api/validate/queue";
      const res = await fetch(url);
      const json = await res.json();
      setItems(json.data || []);
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleAction = async (
    id: string,
    action: "approve" | "reject" | "retry"
  ) => {
    setActionLoading(id);
    try {
      if (action === "retry") {
        await fetch(`/api/validate/${id}/retry`, { method: "POST" });
      } else {
        await fetch(`/api/validate/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
      }
      await fetchQueue();
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Pending
          </Badge>
        );
      case "validating":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Validating
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Failed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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
        {["", "pending", "validating", "failed"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? "bg-cyan/20 text-cyan border-cyan/30" : ""}
          >
            {f || "Active"}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchQueue()}
          className="ml-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No items in queue
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-[var(--glass-subtle)] border border-[var(--glass-border)]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/servers/${item.server.slug}`}
                    className="font-medium hover:text-cyan transition-colors truncate"
                  >
                    {item.server.name}
                  </Link>
                  {getStatusBadge(item.status)}
                  {item.isOwnerSubmission && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 gap-1">
                      <Crown className="w-3 h-3" />
                      Owner
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
                  {item.installCommand && (
                    <code className="text-xs bg-black/30 px-2 py-0.5 rounded truncate max-w-[200px]">
                      {item.installCommand}
                    </code>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/servers/${item.server.slug}`} target="_blank">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>

                {item.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(item.id, "approve")}
                      disabled={actionLoading === item.id}
                      className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                    >
                      {actionLoading === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(item.id, "reject")}
                      disabled={actionLoading === item.id}
                      className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}

                {item.status === "failed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(item.id, "retry")}
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
