import { useMemo, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, RotateCcw, XCircle } from 'lucide-react';
import type { CheckGroup, CheckPage, CheckProblem } from '../types';
import { PrintButton } from './PrintButton';


const splitStem = (q: string): { stem: string; material?: string } => {
  const m = q.match(/^(.*?[?？])\s{2,}([\s\S]+)$/);
  if (m) return { stem: m[1].trim(), material: m[2].trim() };
  return { stem: q };
};

const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();

interface Props {
  pages: CheckPage[];
}

export const CheckView = ({ pages }: Props) => {
  const [pos, setPos] = useState(0);
  const [checked, setChecked] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [ans, setAns] = useState<Record<string, string | number>>({});

  const page = pages[pos];
  const groups: CheckGroup[] = page.checks;

  const matchPools = useMemo(
    () =>
      groups.map((g) => g.problems.filter((p): p is Extract<CheckProblem, { kind: 'match' }> => p.kind === 'match').map((m) => m.right)),
    [groups],
  );

  const reset = () => {
    setAns({});
    setChecked(false);
    setShowAll(false);
  };
  const goto = (i: number) => {
    reset();
    setPos(i);
  };

  const isOk = (key: string, expected: string | number) => {
    const v = ans[key];
    if (typeof expected === 'number') return v === expected;
    return normalize(String(v ?? '')) === normalize(expected);
  };

  const total = groups.reduce((n, g) => n + g.problems.length, 0);
  const correct = groups.reduce((n, g, gi) => {
    return (
      n +
      g.problems.reduce((k, p, pi) => {
        const key = `${gi}-${pi}`;
        if (p.kind === 'ox') return k + (isOk(key, p.answer) ? 1 : 0);
        if (p.kind === 'choose') return k + (isOk(key, p.answer) ? 1 : 0);
        if (p.kind === 'pick') return k + (isOk(key, p.answer) ? 1 : 0);
        if (p.kind === 'match') return k + (isOk(key, p.right) ? 1 : 0);
        return k;
      }, 0)
    );
  }, 0);

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center gap-2 overflow-x-auto">
        {pages.map((p, i) => (
          <button
            key={p.title}
            onClick={() => goto(i)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${i === pos ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-teal-300'}`}
          >
            {p.title.split('—')[1]?.trim() ?? p.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-teal-800">{page.title}</h2>
          {checked && <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold">{correct}/{total}</span>}
        </div>

        <div className="mt-4 space-y-6">
          {groups.map((g, gi) => (
            <section key={gi} className="print-avoid">
              <h3 className="mb-2 font-bold text-slate-700">{g.title}</h3>
              <ol className="space-y-3">
                {g.problems.map((p, pi) => {
                  const key = `${gi}-${pi}`;
                  const reveal = showAll;
                  if (p.kind === 'ox') {
                    const ok = isOk(key, p.answer);
                    return (
                      <li key={pi} className="rounded-lg bg-slate-50 p-3">
                        {(() => { const pp = splitStem(p.q); return (<><p className="text-[15px]">{pp.stem}</p>{pp.material && (<div className="mt-2 rounded-lg border border-slate-200 bg-white p-2 text-sm leading-6 text-slate-700 whitespace-pre-line">{pp.material}</div>)}</>); })()}
                        <div className="mt-2 flex gap-2">
                          {(['O', 'X'] as const).map((c) => {
                            const picked = ans[key] === c;
                            const state = reveal ? (c === p.answer ? 'answer' : 'dim') : checked ? (c === p.answer ? 'answer' : picked ? 'wrong' : 'dim') : picked ? 'picked' : 'idle';
                            return (
                              <button
                                key={c}
                                onClick={() => setAns((a) => ({ ...a, [key]: c }))}
                                className={`h-10 w-14 rounded-lg border text-lg font-bold ${state === 'idle' ? 'border-slate-300 text-slate-500 hover:border-teal-400' : state === 'picked' ? 'border-teal-500 bg-teal-50 text-teal-700' : state === 'answer' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : state === 'wrong' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-400'}`}
                              >
                                {c}
                              </button>
                            );
                          })}
                        </div>
                        {(checked || reveal) && p.explain && (
                          <div className={`mt-2 rounded-lg p-2 text-xs ${ok || reveal ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                            <span className="mr-1 font-bold">{ok || reveal ? '정답' : '오답'} · {p.answer}</span>
                            {p.explain}
                          </div>
                        )}
                      </li>
                    );
                  }
                  if (p.kind === 'choose') {
                    const picked = ans[key];
                    const ok = isOk(key, p.answer);
                    return (
                      <li key={pi} className="rounded-lg bg-slate-50 p-3">
                        {(() => { const pp = splitStem(p.q); return (<><p className="text-[15px]">{pp.stem}</p>{pp.material && (<div className="mt-2 rounded-lg border border-slate-200 bg-white p-2 text-sm leading-6 text-slate-700 whitespace-pre-line">{pp.material}</div>)}</>); })()}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {p.options.map((o, i) => {
                            const state = reveal ? (i === p.answer ? 'answer' : 'dim') : checked ? (i === p.answer ? 'answer' : picked === i ? 'wrong' : 'dim') : picked === i ? 'picked' : 'idle';
                            return (
                              <button
                                key={i}
                                onClick={() => setAns((a) => ({ ...a, [key]: i }))}
                                className={`rounded-lg border px-3 py-1.5 text-sm ${state === 'idle' ? 'border-slate-300 text-slate-600 hover:border-teal-400' : state === 'picked' ? 'border-teal-500 bg-teal-50 text-teal-700' : state === 'answer' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : state === 'wrong' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-400'}`}
                              >
                                {o}
                              </button>
                            );
                          })}
                        </div>
                        {(checked || reveal) && p.explain && (
                          <div className={`mt-2 rounded-lg p-2 text-xs ${ok || reveal ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                            <span className="mr-1 font-bold">정답 · {p.options[p.answer]}</span>
                            {p.explain}
                          </div>
                        )}
                      </li>
                    );
                  }
                  if (p.kind === 'pick') {
                    const picked = ans[key];
                    const ok = isOk(key, p.answer);
                    return (
                      <li key={pi} className="rounded-lg bg-slate-50 p-3">
                        {(() => { const pp = splitStem(p.q); return (<><p className="text-[15px]">{pp.stem}</p>{pp.material && (<div className="mt-2 rounded-lg border border-slate-200 bg-white p-2 text-sm leading-6 text-slate-700 whitespace-pre-line">{pp.material}</div>)}</>); })()}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {p.parts.map((o, i) => {
                            const state = reveal ? (i === p.answer ? 'answer' : 'dim') : checked ? (i === p.answer ? 'answer' : picked === i ? 'wrong' : 'dim') : picked === i ? 'picked' : 'idle';
                            return (
                              <button
                                key={i}
                                onClick={() => setAns((a) => ({ ...a, [key]: i }))}
                                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${state === 'idle' ? 'border-slate-300 text-slate-600 hover:border-teal-400' : state === 'picked' ? 'border-teal-500 bg-teal-50 text-teal-700' : state === 'answer' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : state === 'wrong' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-400'}`}
                              >
                                {o}
                              </button>
                            );
                          })}
                        </div>
                        {(checked || reveal) && p.explain && (
                          <div className={`mt-2 rounded-lg p-2 text-xs ${ok || reveal ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                            <span className="mr-1 font-bold">정답 · {p.parts[p.answer]}</span>
                            {p.explain}
                          </div>
                        )}
                      </li>
                    );
                  }
                  const pool = matchPools[gi];
                  const picked = ans[key] as string | undefined;
                  const ok = isOk(key, p.right);
                  return (
                    <li key={pi} className="rounded-lg bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 sm:min-w-[10rem] text-[15px] font-medium">{p.left}</span>
                        <span className="text-slate-400">→</span>
                        <select
                          value={(picked as string) ?? ''}
                          onChange={(e) => setAns((a) => ({ ...a, [key]: e.target.value }))}
                          className={`w-full min-w-0 max-w-full truncate rounded-lg border px-3 py-1.5 text-sm sm:w-auto ${reveal || (checked && ok) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : checked ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-300'}`}
                        >
                          <option value="">— 선택 —</option>
                          {pool.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        {checked && !ok && !reveal && <XCircle className="h-4 w-4 text-rose-500" />}
                        {(reveal || (checked && ok)) && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </div>
                      {(checked || reveal) && (
                        <div className={`mt-2 rounded-lg p-2 text-xs ${ok || reveal ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>정답 · {p.right}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>

        <div className="no-print mt-6 flex flex-wrap gap-2">
          <button onClick={() => setChecked(true)} className="flex items-center gap-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            <CheckCircle2 className="h-4 w-4" /> 채점하기
          </button>
          <button onClick={() => setShowAll((v) => !v)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
            {showAll ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {showAll ? '정답 가리기' : '정답 보기'}
          </button>
          <button onClick={reset} className="flex items-center gap-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
            <RotateCcw className="h-4 w-4" /> 초기화
          </button>
          <PrintButton label="문제지 인쇄" />
          <PrintButton label="정답지 인쇄" onBefore={() => setShowAll(true)} />
        </div>
      </div>
    </div>
  );
};
