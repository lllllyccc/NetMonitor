import { useState } from "react";
import { legalDocuments } from "../legal/documents";
import { ResultCard } from "../components/ResultCard";
import { useLocale } from "../hooks/useLocale";

const SKIP_KEY = "netmonitor_skip_legal";

export function LegalPage() {
  const [activeDoc, setActiveDoc] = useState(0);
  const [skipEnabled, setSkipEnabled] = useState(() => localStorage.getItem(SKIP_KEY) === "true");
  const { locale } = useLocale();
  const lang = locale === "zh-CN" ? "zh" : "en";
  const doc = legalDocuments[activeDoc];

  const toggleSkip = () => {
    if (skipEnabled) {
      localStorage.removeItem(SKIP_KEY);
      setSkipEnabled(false);
    } else {
      localStorage.setItem(SKIP_KEY, "true");
      setSkipEnabled(true);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-violet-bright bg-clip-text text-transparent">
            {lang === "zh" ? "法律声明与条款" : "Legal Notices & Terms"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {lang === "zh"
              ? "以下文件构成本平台使用条款的组成部分"
              : "The following documents form part of the Terms of Use"}
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 mt-1">
          <input
            type="checkbox"
            checked={skipEnabled}
            onChange={toggleSkip}
            className="w-3.5 h-3.5 rounded border-surface-4 bg-surface-2 text-accent focus:ring-accent/50 accent-accent"
          />
          <span className="text-xs text-gray-500">
            {lang === "zh" ? "启动时不再弹出法律声明" : "Don't show legal modal on startup"}
          </span>
        </label>
      </div>

      {/* Document selector */}
      <div className="flex gap-2 flex-wrap">
        {legalDocuments.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActiveDoc(i)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              activeDoc === i
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-surface-2/50 text-gray-400 hover:text-gray-200 border border-surface-3/30 hover:border-surface-3"
            }`}
          >
            {d.title[lang]}
          </button>
        ))}
      </div>

      {/* Document content */}
      <ResultCard title={doc.title[lang]} delay={0.1}>
        <div className="text-xs text-gray-500 mb-4">
          {lang === "zh" ? "最后更新" : "Last updated"}: {doc.lastUpdated}
        </div>
        <div
          className="legal-content text-sm text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.content[lang]) }}
        />
      </ResultCard>
    </div>
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-gray-200 font-semibold mt-4 mb-2 text-sm">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-gray-100 font-bold mt-6 mb-3 text-base border-b border-surface-3 pb-2">$1</h2>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-3 border-accent pl-4 py-2 my-3 bg-accent/5 rounded-r text-gray-400 italic text-xs">$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-200 font-semibold">$1</strong>')
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-accent font-mono text-xs shrink-0">$1.</span><span>$2</span></div>')
    .replace(/^- (.+)$/gm, '<div class="flex gap-2 my-1 ml-4"><span class="text-accent shrink-0">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<br/>');
}
