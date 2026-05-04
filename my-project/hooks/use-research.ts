import { useState } from 'react';

export type ResearchResult = {
  success: boolean;
  topic: string;
  search_results: string;
  scraped_content: string;
  report: string;
  feedback: string;
  timestamp: string;
  error?: string;
};

export type ResearchStatus = {
  step: string;
  message: string;
};

export function useResearch() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ResearchStatus>({ step: 'idle', message: '' });

  const startResearch = async (topic: string) => {
    if (!topic.trim()) {
      setError('Topic cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setStatus({ step: 'initializing', message: 'Connecting to research agents...' });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/research/stream?topic=${encodeURIComponent(topic)}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start research');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Handle different event types if needed, but here we check the content
              if (data.step) {
                setStatus({ step: data.step, message: data.message });
              } else if (data.success && data.report) {
                setResult(data);
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setStatus({ step: 'idle', message: '' });
    }
  };

  return {
    loading,
    result,
    error,
    status,
    startResearch,
  };
}

