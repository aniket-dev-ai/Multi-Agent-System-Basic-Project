"use client";

import { useResearch } from "@/hooks/use-research";
import { SearchSection } from "./search-section";
import { LoadingState } from "./loading-state";
import { DashboardResults } from "./dashboard-results";
import { ThemeToggle } from "./theme-toggle";

export function ResearchContainer() {
  const { loading, result, error, status, startResearch } = useResearch();

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-primary/20 selection:text-primary">
      {/* Background aesthetic */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 opacity-20 blur-[100px]"></div>

      <header className="w-full flex items-center justify-between py-6 px-8 max-w-7xl mx-auto border-b border-border/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="m4 8 16-4"/><path d="m8.86 6.78.52-2.82a2 2 0 0 1 2.33-1.61l8.23 1.52a2 2 0 0 1 1.61 2.33l-.52 2.82"/></svg>
          </div>
          <span className="font-semibold tracking-tight text-lg">Agenta</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {(!result || loading) && (
          <div className="flex-1 flex flex-col justify-center">
            <SearchSection onSearch={startResearch} loading={loading} />
            {error && (
              <div className="max-w-2xl mx-auto mt-4 w-full p-4 border border-destructive/20 bg-destructive/10 text-destructive text-sm rounded-md shadow-sm">
                <div className="flex items-center gap-2 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Error Details
                </div>
                <div className="mt-1 ml-6">{error}</div>
              </div>
            )}
            {loading && <LoadingState status={status} />}
          </div>
        )}

        {result && !loading && (
          <div className="flex flex-col">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                New Research
              </button>
            </div>
            <DashboardResults result={result} />
          </div>
        )}
      </main>
    </div>
  );
}
