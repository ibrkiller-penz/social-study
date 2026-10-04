import type { McqItem } from '../components/McqSet';
import { FORMATIVE } from './formative';
import { TEACHER_BANKS } from './banks';
import { CURRENT_EXAM } from './exam';
import { QUIZ } from './quiz';

export interface IndexedItem extends McqItem {
  unitId: string;
  teacher: string;
  source: string;
}

let cache: Map<string, IndexedItem> | null = null;

// 기록 키 → 문제 원문. 오답노트에서 사용.
export const questionIndex = (): Map<string, IndexedItem> => {
  if (cache) return cache;
  const m = new Map<string, IndexedItem>();
  const teacherOf = (unitId: string) => CURRENT_EXAM.teachers.find((t) => t.unitId === unitId)?.teacher ?? '';
  for (const [unitId, secs] of Object.entries(FORMATIVE)) {
    secs.forEach((s, pos) =>
      s.questions.forEach((q, i) => {
        const key = `${unitId}:fm:${pos}:${i}`;
        m.set(key, { key, unitId, teacher: teacherOf(unitId), source: `형성평가 · ${s.title.replace(/\s*—\s*형성평가\s*$/, '')}`, q: q.q, choices: q.choices, answer: q.answer, explain: q.explain });
      }),
    );
  }
  for (const b of TEACHER_BANKS) {
    b.hwp.forEach((q, i) => {
      const key = `${b.unitId}:bank:hwp:${i}`;
      m.set(key, { key, unitId: b.unitId, teacher: b.teacher, source: '문제은행 · 미래엔', q: q.q, choices: q.choices, answer: q.answer, explain: q.explain });
    });
    b.suneung.forEach((q, i) => {
      const key = `${b.unitId}:bank:sn:${i}`;
      m.set(key, { key, unitId: b.unitId, teacher: b.teacher, source: '문제은행 · 학습지 기반', q: q.q, choices: q.choices, answer: q.answer, explain: q.explain });
    });
  }
  for (const [unitId, qs] of Object.entries(QUIZ)) {
    qs.forEach((q, i) => {
      const key = `${unitId}:qz:${i}`;
      m.set(key, { key, unitId, teacher: teacherOf(unitId), source: '학습지 퀴즈', q: q.q, choices: q.choices, answer: q.answer, explain: q.explain });
    });
  }
  cache = m;
  return m;
};
