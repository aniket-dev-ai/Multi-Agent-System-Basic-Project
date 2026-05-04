"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

interface ScrapedContentViewProps {
  content: string;
}

export function ScrapedContentView({ content }: ScrapedContentViewProps) {
  return (
    <div className="bg-card border border-border/40 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
      <div className="bg-muted/30 px-6 py-3 border-b border-border/40">
        <h3 className="font-medium text-sm text-foreground/80">Extracted Knowledge Base</h3>
      </div>
      <ScrollArea className="flex-1 h-[60vh] p-6 bg-background">
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
          {content || "No content was scraped during this process."}
        </div>
      </ScrollArea>
    </div>
  );
}
