import { useMemo } from "react";

interface MarkdownRendererProps {
    content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
    const html = useMemo(() => renderMarkdown(content), [content]);

    return (
        <div
            className="prose prose-slate dark:prose-invert prose-sm max-w-none
                prose-headings:font-semibold
                prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                prose-p:leading-relaxed
                prose-a:text-indigo-500 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-indigo-600 dark:hover:prose-a:text-indigo-300
                prose-strong:font-semibold
                prose-code:text-indigo-600 dark:prose-code:text-indigo-300 prose-code:bg-slate-100 dark:prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
                prose-pre:bg-slate-50 dark:prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-white/[0.06] prose-pre:rounded-xl prose-pre:p-4
                prose-li:leading-relaxed
                prose-blockquote:border-l-indigo-500/50 prose-blockquote:text-slate-600 dark:prose-blockquote:text-white/60 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-white/[0.02] prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:pr-4
                [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5
                [&_li]:mb-1
                [&_hr]:border-slate-200 dark:[&_hr]:border-white/[0.06]
            "
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

function renderMarkdown(text: string): string {
    if (!text) return "";

    let html = text;

    // Escape HTML
    html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Code blocks (``` ... ```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
        return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // Inline code (` ... `)
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Headers
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Unordered lists
    html = html.replace(/^[\*\-] (.+)$/gm, "<li>$1</li>");

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

    // Wrap consecutive <li> items
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
        if (match.includes("1.")) {
            return `<ol>${match}</ol>`;
        }
        return `<ul>${match}</ul>`;
    });

    // Blockquotes
    html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

    // Horizontal rules
    html = html.replace(/^---$/gm, "<hr />");

    // Tables
    html = html.replace(/(?:^[ \t]*\|.*\|[ \t]*(?:\n|$))+/gm, (match) => {
        const lines = match.trim().split('\n');
        if (lines.length < 2) return match;
        
        const separatorLine = lines[1].replace(/^[ \t]*\||\|[ \t]*$/g, '').trim();
        if (!/^[-:| ]+$/.test(separatorLine)) return match;
        
        let tableHtml = '<div class="overflow-x-auto"><table>';
        
        lines.forEach((line, index) => {
            if (index === 1) return;
            
            const cleanLine = line.replace(/^[ \t]*\||\|[ \t]*$/g, '').trim();
            const cells = cleanLine.split('|').map(cell => cell.trim());
            
            if (index === 0) {
                tableHtml += '<thead><tr>';
                cells.forEach(cell => { tableHtml += `<th>${cell}</th>`; });
                tableHtml += '</tr></thead><tbody>';
            } else {
                tableHtml += '<tr>';
                cells.forEach(cell => { tableHtml += `<td>${cell}</td>`; });
                tableHtml += '</tr>';
            }
        });
        
        tableHtml += '</tbody></table></div>\n';
        return tableHtml;
    });

    // Paragraphs — wrap lines that aren't already wrapped in HTML tags
    html = html.replace(/^(?!<[a-z])((?!<\/)[^\n]+)$/gm, "<p>$1</p>");

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, "");

    return html;
}
