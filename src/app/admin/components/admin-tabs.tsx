"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { ListTodo, History, BarChart3 } from "lucide-react";
import { ValidationQueue } from "./validation-queue";
import { ValidationHistory } from "./validation-history";
import { ValidationStats } from "./validation-stats";

export function AdminTabs() {
  return (
    <Tabs defaultValue="queue" className="space-y-6">
      <TabsList className="bg-[var(--glass)] border border-[var(--glass-border)]">
        <TabsTrigger value="queue" className="gap-2 data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan">
          <ListTodo className="w-4 h-4" />
          Queue
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan">
          <History className="w-4 h-4" />
          History
        </TabsTrigger>
        <TabsTrigger value="stats" className="gap-2 data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan">
          <BarChart3 className="w-4 h-4" />
          Stats
        </TabsTrigger>
      </TabsList>

      <TabsContent value="queue">
        <GlassCard hover={false}>
          <GlassCardHeader>
            <GlassCardTitle>Validation Queue</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <ValidationQueue />
          </GlassCardContent>
        </GlassCard>
      </TabsContent>

      <TabsContent value="history">
        <GlassCard hover={false}>
          <GlassCardHeader>
            <GlassCardTitle>Validation History</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <ValidationHistory />
          </GlassCardContent>
        </GlassCard>
      </TabsContent>

      <TabsContent value="stats">
        <ValidationStats />
      </TabsContent>
    </Tabs>
  );
}
