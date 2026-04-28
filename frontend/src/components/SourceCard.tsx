import { ExternalLink } from "lucide-react";

interface SourceCardProps {
    title: string;
    url: string;
    index: number;
}

export default function SourceCard({ title, url, index }: SourceCardProps) {
    let domain = "";
    try {
        domain = new URL(url).hostname.replace("www.", "");
    } catch {
        domain = url;
    }

    const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;

    // Staggered animation delay based on index
    const delayClass = index === 0 ? "" : index === 1 ? "delay-75" : index === 2 ? "delay-150" : "delay-200";

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
                group flex-shrink-0 w-[220px] rounded-xl p-3.5
                bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.06]
                border border-slate-200 dark:border-white/[0.06] hover:border-indigo-300 dark:hover:border-indigo-500/25
                transition-all duration-300 cursor-pointer
                shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-indigo-500/[0.04]
                card-hover animate-fade-in-up ${delayClass}
            `}
        >
            <div className="flex items-start gap-2.5">
                <div className="relative shrink-0">
                    {/* Index badge */}
                    <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[9px] font-bold text-white flex items-center justify-center shadow-sm shadow-indigo-500/30">
                        {index + 1}
                    </span>
                    <img
                        src={faviconUrl}
                        alt=""
                        className="w-6 h-6 rounded mt-0.5"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-white/70 group-hover:text-slate-900 dark:group-hover:text-white line-clamp-2 leading-relaxed transition-colors duration-200">
                        {title}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[10px] text-slate-400 dark:text-white/25 group-hover:text-slate-500 dark:group-hover:text-white/40 truncate transition-colors">{domain}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-300 dark:text-white/15 group-hover:text-indigo-500 dark:group-hover:text-indigo-400/60 shrink-0 transition-colors" />
                    </div>
                </div>
            </div>
        </a>
    );
}
