import { useState } from "react";
import { legalDocuments } from "../legal/documents";
import { useLocale } from "../hooks/useLocale";

export function LegalModal({ onAgree }: { onAgree: (dontShowAgain: boolean) => void }) {
  const [activeTab, setActiveTab] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const { locale } = useLocale();
  const lang = locale === "zh-CN" ? "zh" : "en";
  const doc = legalDocuments[activeTab];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface-1 border border-surface-3 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="p-5 border-b border-surface-3 shrink-0">
          <h2 className="text-lg font-bold text-gray-100">
            {lang === "zh" ? "使用条款与法律声明" : "Terms of Use & Legal Notices"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {lang === "zh"
              ? "请仔细阅读以下条款，继续使用即表示您同意这些条款"
              : "Please read the following terms carefully. Continuing to use this site indicates your acceptance."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-3 overflow-x-auto shrink-0">
          {legalDocuments.map((d, i) => (
            <button
              key={d.id}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                activeTab === i
                  ? "text-accent border-b-2 border-accent bg-accent/5"
                  : "text-gray-400 hover:text-gray-200 hover:bg-surface-2"
              }`}
            >
              {d.title[lang]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 prose prose-invert prose-sm max-w-none">
          <div className="text-xs text-gray-500 mb-4">
            {lang === "zh" ? "最后更新" : "Last updated"}: {doc.lastUpdated}
          </div>
          <div
            className="legal-content text-sm text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.content[lang]) }}
          />
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-surface-3 shrink-0">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(e) => setDontShow(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-surface-4 bg-surface-2 text-accent focus:ring-accent/50 accent-accent"
              />
              <span className="text-xs text-gray-500">
                {lang === "zh" ? "下次不再显示" : "Don't show again"}
              </span>
            </label>
            <button
              onClick={() => onAgree(dontShow)}
              className="btn-primary px-8"
            >
              {lang === "zh" ? "同意" : "Agree"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-gray-200 font-semibold mt-4 mb-2 text-sm">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-gray-100 font-bold mt-6 mb-3 text-base">$1</h2>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-3 border-accent pl-4 py-2 my-3 bg-accent/5 rounded-r text-gray-400 italic text-xs">$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-200 font-semibold">$1</strong>')
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-accent font-mono text-xs shrink-0">$1.</span><span>$2</span></div>')
    .replace(/^- (.+)$/gm, '<div class="flex gap-2 my-1 ml-4"><span class="text-accent shrink-0">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<br/>');
}
