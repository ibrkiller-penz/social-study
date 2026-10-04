import { useMemo, useRef, useState } from 'react';
import { AlertCircle, BookOpenCheck, CheckCircle2, Eye, EyeOff, RotateCcw, Timer, Trash2 } from 'lucide-react';
import type { StudyStore } from '../store';
import { McqCard } from './McqCard';
import { PrintButton } from './PrintButton';
import { QSTRUCT } from '../data/qstruct';

export interface McqItem {
  key: string; // 기록용 고유 키
  q: string;
  choices: string[];
  answer: number;
  explain?: string;
  tag?: string;
}

interface Props {
  items: McqItem[];
  store: StudyStore;
  printLabel?: string;
  emptyText?: string;
  hideWrongToggle?: boolean;
}

type Mode = 'study' | 'exam';

export const McqSet = ({ items, store, printLabel = '문제지 인쇄', emptyText, hideWrongToggle }: Props) => {
  const [mode, setMode] = useState<Mode>('study');
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [graded, setGraded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [wrongKeys, setWrongKeys] = useState<Set<string> | null>(null);
  const recorded = useRef<Set<string>>(new Set());

  const [page, setPage] = useState(0);
  const attempts = store.state.attempts ?? {};
  const pool = useMemo(() => (wrongKeys ? items.filter((it) => wrongKeys.has(it.key)) : items), [items, wrongKeys]);
  // 25문항이 넘으면 1/n 로 나눠 세트당 20문항 안팎으로 푼다
  const pages = useMemo(() => {
    if (pool.length <= 25) return [pool];
    const n = Math.ceil(pool.length / 20);
    const size = Math.ceil(pool.length / n);
    return Array.from({ length: n }, (_, k) => pool.slice(k * size, (k + 1) * size)).filter((p) => p.length);
  }, [pool]);
  const cur = Math.min(page, pages.length - 1);
  const visible = pages[cur] ?? [];
  const offset = pages.slice(0, cur).reduce((a, p) => a + p.length, 0);

  const record = (it: McqItem, pick: number) => {
    if (recorded.current.has(it.key)) return;
    recorded.current.add(it.key);
    store.recordAttempt(it.key, pick === it.answer);
  };

  const pick = (it: McqItem, j: number) => {
    if (mode === 'study') {
      if (picks[it.key] != null) return; // 학습 모드는 첫 선택으로 확정
      setPicks((p) => ({ ...p, [it.key]: j }));
      record(it, j);
    } else {
      if (graded) return;
      setPicks((p) => ({ ...p, [it.key]: j }));
    }
  };

  const grade = () => {
    setGraded(true);
    visible.forEach((it) => {
      const p = picks[it.key];
      if (p != null) record(it, p);
    });
  };

  const reset = () => {
    setPicks({});
    setGraded(false);
    setShowAll(false);
    recorded.current = new Set();
  };

  const toggleWrong = () => {
    if (wrongKeys) {
      setWrongKeys(null);
    } else {
      const s = new Set(items.filter((it) => attempts[it.key]?.r1 === 'X' || attempts[it.key]?.r2 === 'X').map((it) => it.key));
      setWrongKeys(s);
    }
    setPage(0);
    reset();
  };

  const answered = visible.filter((it) => picks[it.key] != null);
  const correct = answered.filter((it) => picks[it.key] === it.answer).length;
  const showScore = mode === 'study' ? answered.length > 0 : graded;

  return (
    <div>
      <div className="no-print mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-white ring-1 ring-slate-200">
          <button
            onClick={() => { setMode('study'); reset(); }}
            className={`flex items-center gap-1 rounded-l-lg px-3 py-1.5 text-xs font-semibold ${mode === 'study' ? 'bg-teal-600 text-white' : 'text-slate-600'}`}
            title="한 문제씩 고르면 바로 정답과 해설이 나와요"
          >
            <BookOpenCheck className="h-3.5 w-3.5" /> 학습 모드
          </button>
          <button
            onClick={() => { setMode('exam'); reset(); }}
            className={`flex items-center gap-1 rounded-r-lg px-3 py-1.5 text-xs font-semibold ${mode === 'exam' ? 'bg-teal-600 text-white' : 'text-slate-600'}`}
            title="다 풀고 마지막에 채점해요"
          >
            <Timer className="h-3.5 w-3.5" /> 시험 모드
          </button>
        </div>
        {!hideWrongToggle && (
        <button
          onClick={toggleWrong}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${wrongKeys ? 'bg-rose-600 text-white' : 'bg-white text-rose-600 ring-1 ring-rose-200'}`}
        >
          <AlertCircle className="h-3.5 w-3.5" /> {wrongKeys ? '전체 문제' : '오답만'}
        </button>
        )}
        <button onClick={reset} className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          <RotateCcw className="h-3.5 w-3.5" /> 초기화
        </button>
        {showScore && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
            {correct}/{mode === 'study' ? answered.length : visible.length} 정답
          </span>
        )}
      </div>

      {pages.length > 1 && (
        <div className="no-print mb-3">
          <div className="mb-1.5 text-xs text-slate-500">총 {pool.length}문항 · {pages.length}세트로 나눠 풀어요</div>
          <div className="flex flex-wrap gap-1.5">
            {pages.map((pg, k) => {
              const start = pages.slice(0, k).reduce((a, p) => a + p.length, 0);
              const done = pg.filter((it) => attempts[it.key]?.r1).length;
              const wrong = pg.filter((it) => attempts[it.key]?.r1 === 'X' || attempts[it.key]?.r2 === 'X').length;
              return (
                <button
                  key={k}
                  onClick={() => { setPage(k); reset(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${k === cur ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
                >
                  {k + 1}세트 <span className={k === cur ? 'text-teal-100' : 'text-slate-400'}>({start + 1}~{start + pg.length})</span>
                  {done > 0 && <span className={`ml-1 ${k === cur ? 'text-white' : 'text-emerald-600'}`}>✓{done}</span>}
                  {wrong > 0 && <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{wrong}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          {wrongKeys ? '여기서 틀렸던 문제가 없어요. 👏' : emptyText ?? '문제가 없습니다.'}
        </div>
      ) : (
        <ol className="space-y-4">
          {visible.map((it, i) => (
            <McqCard
              key={it.key}
              index={offset + i + 1}
              tag={it.tag}
              q={it.q}
              choices={it.choices}
              answer={it.answer}
              explain={it.explain}
              picked={picks[it.key]}
              reveal={showAll || (mode === 'study' ? picks[it.key] != null : graded)}
              forceExplain={showAll}
              locked={mode === 'study' ? picks[it.key] != null : graded}
              attempt={attempts[it.key]}
              s={QSTRUCT[it.key]}
              onPick={(j) => pick(it, j)}
            />
          ))}
        </ol>
      )}

      {pages.length > 1 && cur < pages.length - 1 && (
        <button
          onClick={() => { setPage(cur + 1); reset(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="no-print mt-5 w-full rounded-xl bg-teal-50 py-3 text-sm font-semibold text-teal-700 ring-1 ring-teal-200"
        >
          다음 세트로 ({cur + 2}세트 / {pages.length}) →
        </button>
      )}

      <div className="no-print mt-5 flex flex-wrap gap-2">
        {mode === 'exam' && !graded && (
          <button onClick={grade} className="flex items-center gap-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            <CheckCircle2 className="h-4 w-4" /> 채점하기
          </button>
        )}
        <button onClick={() => setShowAll((v) => !v)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          {showAll ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {showAll ? '해설 모두 닫기' : '해설 모두 보기'}
        </button>
        <button onClick={reset} className="flex items-center gap-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          <RotateCcw className="h-4 w-4" /> 초기화
        </button>
        <button
          onClick={() => {
            if (confirm('이 문제들의 1차·2차 풀이 기록을 모두 지울까요?')) {
              store.resetKeys(items.map((it) => it.key));
              reset();
            }
          }}
          className="flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-rose-600 ring-1 ring-rose-200"
        >
          <Trash2 className="h-4 w-4" /> 기록 초기화
        </button>
        <PrintButton label={printLabel} />
        <PrintButton label="정답 포함 인쇄" onBefore={() => setShowAll(true)} onAfter={() => setShowAll(false)} />
      </div>
    </div>
  );
};
