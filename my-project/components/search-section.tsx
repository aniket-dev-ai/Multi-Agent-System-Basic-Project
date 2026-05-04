"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchSectionProps {
  onSearch: (topic: string) => void;
  loading: boolean;
}

export function SearchSection({ onSearch, loading }: SearchSectionProps) {
  const [topic, setTopic] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSearch(topic);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center space-y-8 py-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Agent Research Engine
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Enter a topic to synthesize intelligent insights, scrape relevant data, and generate a comprehensive report.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl relative flex items-center">
        <div className="relative w-full flex items-center">
          <svg
            className="absolute left-4 w-5 h-5 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            type="text"
            placeholder="e.g. Advancements in Quantum Computing 2026..."
            className="w-full pl-12 pr-32 h-14 text-base rounded-full border-muted-foreground/30 bg-background/50 backdrop-blur-md focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
          />
          <div className="absolute right-2">
            <Button
              type="submit"
              disabled={loading || !topic.trim()}
              className="rounded-full px-6 h-10 font-medium"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Processing</span>
                </div>
              ) : (
                "Research"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
