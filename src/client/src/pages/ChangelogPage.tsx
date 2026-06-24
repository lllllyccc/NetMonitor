import { changelog } from "../legal/changelog";
import { ResultCard } from "../components/ResultCard";
import { useLocale } from "../hooks/useLocale";

export function ChangelogPage() {
  const { locale } = useLocale();
  const lang = locale === "zh-CN" ? "zh" : "en";

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-violet-bright bg-clip-text text-transparent">
          {lang === "zh" ? "更新日志" : "Changelog"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {lang === "zh"
            ? "NetMonitor 版本历史与更新记录"
            : "Version history and update records for NetMonitor"}
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-surface-3/60" />

        {changelog.map((entry, i) => (
          <div key={entry.version} className="relative pl-10 pb-8 last:pb-0">
            {/* Timeline dot */}
            <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-accent border-2 border-surface-1 shadow-glow-sm" />

            <ResultCard title="" delay={Math.min(i * 0.1, 0.3)}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg font-bold text-accent font-mono">v{entry.version}</span>
                <span className="text-xs text-gray-500">{entry.date}</span>
                {entry.tag && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
                    {entry.tag[lang]}
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-300 leading-relaxed space-y-1">
                {entry.changes[lang].map((line, j) => {
                  if (line === "") return <div key={j} className="h-2" />;
                  if (line.startsWith("## ")) {
                    return (
                      <h3 key={j} className="text-gray-200 font-semibold mt-4 mb-2 text-sm">
                        {line.replace(/^## /, "")}
                      </h3>
                    );
                  }
                  if (line.startsWith("- ")) {
                    const content = line.replace(/^- /, "");
                    return (
                      <div key={j} className="flex gap-2 my-1">
                        <span className="text-accent shrink-0 mt-0.5">•</span>
                        <span dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
                      </div>
                    );
                  }
                  return <div key={j}>{line}</div>;
                })}
              </div>
            </ResultCard>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-200 font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="text-accent bg-accent/10 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
}
