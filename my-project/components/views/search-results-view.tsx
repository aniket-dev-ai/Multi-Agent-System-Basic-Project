"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResultsViewProps {
  content: string;
}

export function SearchResultsView({ content }: SearchResultsViewProps) {
  return (
    <div className="bg-card border border-border/40 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
      <div className="bg-muted/30 px-6 py-3 border-b border-border/40">
        <h3 className="font-medium text-sm text-foreground/80">Raw Search Queries & Results</h3>
      </div>
      <ScrollArea className="flex-1 h-[60vh] p-4 bg-muted/5 font-mono text-xs">
        <pre className="whitespace-pre-wrap text-muted-foreground break-words p-4 bg-background border border-border/40 rounded-md">
          {content || "No search results available."}
        </pre>
      </ScrollArea>
    </div>
  );
}
