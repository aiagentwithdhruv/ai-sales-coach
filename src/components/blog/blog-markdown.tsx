"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function BlogMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold text-platinum mt-10 mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold text-platinum mt-10 mb-4">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-bold text-platinum mt-8 mb-3">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg font-semibold text-platinum mt-6 mb-2">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="text-silver leading-relaxed mb-4">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="text-platinum font-semibold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="text-silver italic">{children}</em>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-neonblue hover:text-electricblue underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="list-disc ml-6 mb-4 space-y-1.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal ml-6 mb-4 space-y-1.5">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-silver leading-relaxed">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-neonblue pl-4 py-1 my-4 text-silver italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-gunmetal my-8" />,
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="text-sm">{children}</code>
            );
          }
          return (
            <code className="bg-onyx px-1.5 py-0.5 rounded text-neonblue text-sm">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-onyx rounded-lg p-4 overflow-x-auto my-4 text-sm">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-6 rounded-lg border border-gunmetal">
            <table className="w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-graphite/50 border-b border-gunmetal">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-gunmetal/50">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-graphite/30 transition-colors">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2.5 text-left text-xs font-semibold text-platinum uppercase tracking-wider">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2.5 text-silver whitespace-nowrap">{children}</td>
        ),
        img: ({ src, alt }) => (
          <img src={src} alt={alt || ""} className="rounded-lg my-4 max-w-full" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
