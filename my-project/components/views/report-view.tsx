import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReportViewProps {
  content: string;
}

export function ReportView({ content }: ReportViewProps) {
  return (
    <div className="bg-card border border-border/40 rounded-xl shadow-lg overflow-hidden transition-all hover:border-primary/20">
      <div className="bg-muted/30 px-6 py-4 border-b border-border/40 flex justify-between items-center bg-gradient-to-r from-muted/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
          <h3 className="font-semibold text-sm tracking-tight text-foreground/90 uppercase">Final Synthesized Report</h3>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20"></div>
          ))}
        </div>
      </div>
      <ScrollArea className="h-[70vh] px-8 py-8">
        <div className="max-w-none pb-12 prose prose-slate dark:prose-invert">
          {content ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 tracking-tight" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mt-10 mb-4 text-primary/90 border-b border-border/50 pb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-medium mt-8 mb-3 text-foreground/80" {...props} />,
                p: ({node, ...props}) => <p className="leading-relaxed text-muted-foreground mb-5 text-[1.05rem]" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-6 space-y-2 text-muted-foreground" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-6 space-y-2 text-muted-foreground" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                em: ({node, ...props}) => <em className="italic text-foreground/80" {...props} />,
                code: ({node, ...props}) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary border border-border/40" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-6 italic text-muted-foreground bg-primary/5 rounded-r" {...props} />,
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <p className="text-muted-foreground italic text-lg">No report content available yet.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

