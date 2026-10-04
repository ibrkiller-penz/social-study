import { useMemo, useState } from 'react';
import { BookMarked } from 'lucide-react';
import { questionIndex } from '../data/questionIndex';
import { CURRENT_EXAM } from '../data/exam';
import { McqSet } from '../components/McqSet';
import type { StudyStore } from '../store';
import type { AttemptRecord } from '../types';

type Filter = 'any' | 'still' | 'r2';

const latest = (a: AttemptRecord) => a.r2 ?? a.r1;

export const countWrong = (attempts: Record<string, AttemptRecord> = {}) =>
  Object.values(attempts).filter((a) => latest(a) === 'X').length;

export const WrongPage = ({ store }: { store: StudyStore }) => {
  const [filter, setFilter] = useState<Filter>('still');
  const [teacher, setTeacher] = useState<string>('all');
  // 처음 열었을 때의 기록으로 목록을 고정 (풀자마자 목록에서 사라지지 않게)
  const [snapshot, setSnapshot] = useState(() => store.state.attempts ?? {});
  const idx = questionIndex();

  const counts = useMemo(() => {
    const vals = Object.values(snapshot);
    return {
      any: vals.filter((a) => a.r1 === 'X' || a.r2 === 'X').length,
      still: vals.filter((a) => latest(a) === 'X').length,
      r2: vals.filter((a) => a.r2 === 'X').length,
    };
  }, [snapshot]);

  const items = useMemo(() => {
    return Object.entries(snapshot)
      .filter(([, a]) => (filter === 'any' ? a.r1 === 'X' || a.r2 === 'X' : filter === 'still' ? latest(a) === 'X' : a.r2 === 'X'))
      .map(([k]) => idx.get(k))
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .filter((x) => teacher === 'all' || x.teacher === teacher)
      .map((x) => ({ ...x, tag: `${x.teacher} · ${x.source}` }));
  }, [snapshot, filter, teacher, idx]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <BookMarked className="h-6 w-6 text-rose-500" />
        <h1 className="text-2xl font-bold">오답노트</h1>
      </div>
      <p className="mt-1 text-sm text-slate-500">형성평가·문제은행·퀴즈·모의고사에서 틀린 문제가 모여요. 시험 직전엔 ‘아직 못 맞힌 문제’만 다시 풀어 보세요.</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {([
          ['still', `아직 못 맞힌 문제 ${counts.still}`],
          ['r2', `2차에도 틀린 문제 ${counts.r2}`],
          ['any', `한 번이라도 틀린 문제 ${counts.any}`],
        ] as [Filter, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1.5 font-semibold ${filter === k ? 'bg-rose-600 text-white' : 'bg-white text-rose-600 ring-1 ring-rose-200'}`}>
            {label}
          </button>
        ))}
        <button onClick={() => setSnapshot(store.state.attempts ?? {})} className="rounded-full bg-white px-3 py-1.5 font-semibold text-slate-600 ring-1 ring-slate-200">
          목록 새로고침
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-xs">
        {['all', ...CURRENT_EXAM.teachers.map((t) => t.teacher)].map((t) => (
          <button key={t} onClick={() => setTeacher(t)} className={`rounded-full px-2.5 py-1 font-medium ${teacher === t ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
            {t === 'all' ? '전체 선생님' : `${t}T`}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <McqSet key={`${filter}-${teacher}`} items={items} store={store} printLabel="오답 문제 인쇄" hideWrongToggle emptyText="틀린 문제가 없어요. 형성평가나 문제은행을 먼저 풀어 보세요!" />
      </div>
    </div>
  );
};
