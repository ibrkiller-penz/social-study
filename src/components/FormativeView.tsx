import { useMemo, useState } from 'react';
import type { FormativeSection } from '../types';
import type { StudyStore } from '../store';
import { McqSet, type McqItem } from './McqSet';

interface Props {
  sections: FormativeSection[];
  unitId: string;
  store: StudyStore;
}

export const fmKey = (unitId: string, pos: number, i: number) => `${unitId}:fm:${pos}:${i}`;

export const FormativeView = ({ sections, unitId, store }: Props) => {
  const [pos, setPos] = useState(0);
  const section = sections[pos];
  const attempts = store.state.attempts ?? {};

  const items: McqItem[] = useMemo(
    () =>
      section.questions.map((q, i) => ({
        key: fmKey(unitId, pos, i),
        q: q.q,
        choices: q.choices,
        answer: q.answer,
        explain: q.explain,
      })),
    [section, unitId, pos],
  );

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap gap-1.5">
        {sections.map((s, i) => {
          const wrong = s.questions.filter((_, j) => {
            const a = attempts[fmKey(unitId, i, j)];
            return a?.r1 === 'X' || a?.r2 === 'X';
          }).length;
          return (
            <button
              key={s.title}
              onClick={() => setPos(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${i === pos ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
            >
              {s.title.match(/^주제\s*\d+/)?.[0] ?? s.title}
              <span className={i === pos ? 'text-teal-100' : 'text-slate-400'}> · {s.questions.length}문항</span>
              {wrong > 0 && <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{wrong}</span>}
            </button>
          );
        })}
      </div>
      <h2 className="mb-3 text-lg font-bold text-teal-800">{section.title}</h2>
      <McqSet key={pos} items={items} store={store} printLabel="형성평가 인쇄" />
    </div>
  );
};
