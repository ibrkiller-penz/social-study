import { useMemo, useState } from 'react';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import type { TeacherBank } from '../data/banks';
import type { StudyStore } from '../store';
import { McqSet, type McqItem } from './McqSet';
import { PrintButton } from './PrintButton';

type Mode = 'mcq' | 'short';
type Src = 'all' | 'hwp' | 'suneung';

const norm = (s: string) => s.replace(/\s/g, '').replace(/[.,·]/g, '').toLowerCase();

export const bankItems = (bank: TeacherBank): McqItem[] => [
  ...bank.hwp.map((q, i) => ({ key: `${bank.unitId}:bank:hwp:${i}`, q: q.q, choices: q.choices, answer: q.answer, explain: q.explain, tag: '미래엔 출제대비' })),
  ...bank.suneung.map((q, i) => ({ key: `${bank.unitId}:bank:sn:${i}`, q: q.q, choices: q.choices, answer: q.answer, explain: q.explain, tag: '학습지 기반' })),
];

export const TeacherBankView = ({ bank, store }: { bank: TeacherBank; store: StudyStore }) => {
  const [mode, setMode] = useState<Mode>('mcq');
  const [src, setSrc] = useState<Src>('all');
  const all = useMemo(() => bankItems(bank), [bank]);
  const items = useMemo(
    () => (src === 'all' ? all : all.filter((it) => (src === 'hwp' ? it.key.includes(':hwp:') : it.key.includes(':sn:')))),
    [all, src],
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-white ring-1 ring-slate-200">
          <button onClick={() => setMode('mcq')} className={`rounded-l-lg px-3 py-1.5 text-sm font-semibold ${mode === 'mcq' ? 'bg-teal-600 text-white' : 'text-slate-600'}`}>
            선택형 {all.length}
          </button>
          <button onClick={() => setMode('short')} className={`rounded-r-lg px-3 py-1.5 text-sm font-semibold ${mode === 'short' ? 'bg-teal-600 text-white' : 'text-slate-600'}`}>
            단답형 {bank.short.length}
          </button>
        </div>
        {mode === 'mcq' && (
          <div className="flex gap-1 text-xs">
            {([
              ['all', '전체'],
              ['hwp', `미래엔 ${bank.hwp.length}`],
              ['suneung', `학습지 기반 ${bank.suneung.length}`],
            ] as [Src, string][])
              .filter(([k]) => k !== 'hwp' || bank.hwp.length > 0)
              .map(([k, label]) => (
                <button key={k} onClick={() => setSrc(k)} className={`rounded-full px-2.5 py-1 font-medium ${src === k ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
                  {label}
                </button>
              ))}
          </div>
        )}
      </div>

      {mode === 'mcq' ? (
        <McqSet key={src} items={items} store={store} />
      ) : (
        <ShortSet bank={bank} />
      )}
    </div>
  );
};

const ShortSet = ({ bank }: { bank: TeacherBank }) => {
  const [ans, setAns] = useState<Record<number, string>>({});
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [showAll, setShowAll] = useState(false);

  return (
    <div>
      <p className="mb-3 text-xs text-slate-500">답을 쓰고 ‘확인’을 누르면 모범 답안과 핵심어가 나와요.</p>
      <ol className="space-y-3">
        {bank.short.map((q, i) => {
          const a = norm(ans[i] ?? '');
          const hit = q.keywords.filter((k) => a.includes(norm(k))).length;
          const ok = hit >= Math.ceil(q.keywords.length * 0.6);
          const reveal = showAll || open[i];
          return (
            <li key={i} className="print-avoid rounded-2xl border border-slate-200 bg-white p-4">
              <p className="font-semibold leading-relaxed">
                <span className="mr-1 text-teal-700">{i + 1}.</span>
                {q.q}
              </p>
              <div className="no-print mt-2 flex gap-2">
                <input
                  value={ans[i] ?? ''}
                  onChange={(e) => setAns((p) => ({ ...p, [i]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && setOpen((p) => ({ ...p, [i]: true }))}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="답을 입력하세요"
                />
                <button onClick={() => setOpen((p) => ({ ...p, [i]: true }))} className="shrink-0 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white">
                  확인
                </button>
              </div>
              {reveal && (
                <div className={`mt-2 rounded-lg p-3 text-sm ${!ans[i] ? 'bg-slate-50 text-slate-700' : ok ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
                  <div className="font-bold">모범 답안: {q.answer}</div>
                  {ans[i] && <div className="mt-1 text-xs">핵심어 {hit}/{q.keywords.length}개 포함 {ok ? '— 정답 인정' : ''}</div>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="no-print mt-5 flex flex-wrap gap-2">
        <button onClick={() => setShowAll((v) => !v)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
          {showAll ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {showAll ? '정답 가리기' : '정답 모두 보기'}
        </button>
        <button onClick={() => { setAns({}); setOpen({}); setShowAll(false); }} className="flex items-center gap-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
          <RotateCcw className="h-4 w-4" /> 다시 풀기
        </button>
        <PrintButton label="단답형 인쇄" />
        <PrintButton label="정답 포함 인쇄" onBefore={() => setShowAll(true)} onAfter={() => setShowAll(false)} />
      </div>
    </div>
  );
};
