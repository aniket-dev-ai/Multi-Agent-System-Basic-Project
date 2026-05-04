"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportView } from "./views/report-view";
import { SearchResultsView } from "./views/search-results-view";
import { ScrapedContentView } from "./views/scraped-content-view";
import { FeedbackView } from "./views/feedback-view";
import { Badge } from "@/components/ui/badge";
import type { ResearchResult } from "@/hooks/use-research";

interface DashboardResultsProps {
  result: ResearchResult;
}

export function DashboardResults({ result }: DashboardResultsProps) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20 border border-border/40 p-5 rounded-lg">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Research Analysis Complete</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Topic:</span> 
            <span className="truncate max-w-md">{result.topic}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1 bg-background shadow-sm border-border/50">
            {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Badge>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
            Success
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="report" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-muted/30 border border-border/40 p-1">
          <TabsTrigger value="report" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Final Report</TabsTrigger>
          <TabsTrigger value="search" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Search Logic</TabsTrigger>
          <TabsTrigger value="scraped" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Scraped Data</TabsTrigger>
          <TabsTrigger value="feedback" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Critic Feedback</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="report" className="m-0 border-none p-0 outline-none">
            <ReportView content={result.report} />
          </TabsContent>
          <TabsContent value="search" className="m-0 border-none p-0 outline-none">
            <SearchResultsView content={result.search_results} />
          </TabsContent>
          <TabsContent value="scraped" className="m-0 border-none p-0 outline-none">
            <ScrapedContentView content={result.scraped_content} />
          </TabsContent>
          <TabsContent value="feedback" className="m-0 border-none p-0 outline-none">
            <FeedbackView content={result.feedback} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
