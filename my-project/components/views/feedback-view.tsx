"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface FeedbackViewProps {
  content: string;
}

export function FeedbackView({ content }: FeedbackViewProps) {
  return (
    <div className="bg-card border border-border/40 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
      <div className="bg-muted/30 px-6 py-3 border-b border-border/40 flex items-center justify-between">
        <h3 className="font-medium text-sm text-foreground/80">Agent Critic Feedback</h3>
        <Badge variant="outline" className="text-xs bg-background">Evaluation</Badge>
      </div>
      <ScrollArea className="flex-1 h-[60vh] p-6 bg-muted/5">
        <div className="bg-background border border-border/50 rounded-md p-5 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed shadow-sm">
          {content || "No feedback generated."}
        </div>
      </ScrollArea>
    </div>
  );
}
