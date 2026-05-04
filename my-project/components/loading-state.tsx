"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ResearchStatus } from "@/hooks/use-research";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface LoadingStateProps {
  status: ResearchStatus;
}

const STEPS = [
  { id: 'initializing', label: 'Initializing' },
  { id: 'searching', label: 'Web Search' },
  { id: 'reading', label: 'Deep Reading' },
  { id: 'writing', label: 'Report Drafting' },
  { id: 'critic', label: 'Quality Review' },
];

export function LoadingState({ status }: LoadingStateProps) {
  const currentStepIndex = STEPS.findIndex(s => s.id === status.step);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 mt-8 pb-20">
      <div className="flex flex-col items-center justify-center text-center space-y-4 mb-12">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
          <div className="relative w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Agents at work...</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            {status.message || "Synthesizing research from multiple sources"}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4 items-start">
        <Card className="lg:col-span-1 border-primary/10 bg-muted/5 shadow-xl backdrop-blur-sm sticky top-8">
          <CardHeader className="pb-4 border-b border-border/40">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Pipeline Status</h3>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {STEPS.map((step, i) => {
              const isCompleted = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-500 ${
                    isCompleted ? 'bg-primary border-primary text-primary-foreground' : 
                    isCurrent ? 'bg-primary/10 border-primary text-primary animate-pulse' : 
                    'bg-muted border-muted-foreground/20 text-muted-foreground'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : 
                     isCurrent ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                     <Circle className="w-3 h-3" />}
                  </div>
                  <span className={`text-sm font-medium transition-colors duration-500 ${
                    isCompleted ? 'text-foreground/70 line-through' : 
                    isCurrent ? 'text-primary font-bold' : 
                    'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/40 bg-card/50 shadow-inner">
            <CardHeader className="pb-4 border-b border-border/40 mb-6 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
              </div>
              
              <div className="space-y-4 pt-4 border-t border-border/20">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[85%]" />
                <Skeleton className="h-4 w-[95%]" />
              </div>

              <div className="space-y-3 pt-4 border-t border-border/20">
                <Skeleton className="h-5 w-32 mb-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[70%]" />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-full bg-primary/5 border border-primary/10 flex items-center gap-2 text-xs font-medium text-primary/60">
              <span className="w-1 h-1 rounded-full bg-primary animate-ping"></span>
              Real-time Analysis Pipeline Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

