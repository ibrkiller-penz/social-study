import { BookOpen, FileText, Info } from 'lucide-react';
import { TEXTBOOK } from '../data/textbook';
import { PrintButton } from './PrintButton';

export const TextbookView = ({ unitId }: { unitId: string }) => {
  const ch = TEXTBOOK[unitId];
  if (!ch) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-teal-700 ring-1 ring-slate-200">
          <BookOpen className="h-4 w-4" />
          {ch.chapter}
        </div>
        <div className="no-print ml-auto flex flex-wrap items-center gap-2">
          <PrintButton label="교과서 인쇄" />
        </div>
      </div>

      {ch.note && (
        <div className="mb-4 flex gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{ch.note}</p>
        </div>
      )}

      {ch.topics.length === 0 && !ch.note && (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          아직 반영된 교과서 내용이 없습니다.
        </div>
      )}

      {ch.topics.map((t, i) => (
        <section key={i} className="print-avoid mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-teal-800">{t.title}</h2>
            <span className="text-xs text-slate-500">{t.pages}</span>
          </div>
          <div className="space-y-3 text-[15px] leading-7 text-slate-800">
            {t.paragraphs.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </div>
          {t.boxes && t.boxes.length > 0 && (
            <div className="mt-4 space-y-3">
              {t.boxes.map((b, k) => (
                <div key={k} className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                  <div className="mb-1 flex items-center gap-1 text-xs font-bold text-teal-700">
                    <FileText className="h-3.5 w-3.5" />
                    {b.label}
                  </div>
                  <p className="whitespace-pre-line text-sm leading-6 text-slate-800">{b.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
};
