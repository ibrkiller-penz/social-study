import { useCallback, useEffect, useRef, useState } from 'react';
import type { StudyState, UnitProgress } from './types';
import { loadRemote, saveRemote, watchUser, type User } from './firebase';

const KEY = 'social-study-state-v2';
const EMPTY: StudyState = { progress: {}, wrong: {}, knownTerms: {}, attempts: {} };

// v2: attempts[key] = { r1?: 'O'|'X'; r2?: 'O'|'X'; lastAt: number }
//    - r1 = 첫 번째 응시 결과
//    - r2 = 두 번째 응시 결과 (있을 때만)

const readLocal = (): StudyState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
    // v1 migration
    const v1 = localStorage.getItem('social-study-state-v1');
    if (v1) {
      const parsed = JSON.parse(v1);
      return { ...EMPTY, ...parsed };
    }
    return EMPTY;
  } catch {
    return EMPTY;
  }
};

const writeLocal = (s: StudyState) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* 저장 불가 환경은 무시 */
  }
};

const merge = (a: StudyState, b: StudyState): StudyState => {
  const progress: Record<string, UnitProgress> = { ...a.progress };
  for (const [id, p] of Object.entries(b.progress)) {
    const q = progress[id];
    progress[id] = q
      ? { bestScore: Math.max(p.bestScore, q.bestScore), attempts: Math.max(p.attempts, q.attempts), lastStudied: Math.max(p.lastStudied, q.lastStudied) }
      : p;
  }
  // Attempt merge: prefer newer lastAt
  const attempts = { ...(a.attempts ?? {}) };
  for (const [k, v] of Object.entries(b.attempts ?? {})) {
    const prev = attempts[k];
    if (!prev || (v.lastAt ?? 0) > (prev.lastAt ?? 0)) attempts[k] = v;
  }
  return {
    progress,
    wrong: { ...a.wrong, ...b.wrong },
    knownTerms: { ...a.knownTerms, ...b.knownTerms },
    attempts,
  };
};

export const useStudyStore = () => {
  const [state, setState] = useState<StudyState>(readLocal);
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);

  useEffect(
    () =>
      watchUser(async (u) => {
        userRef.current = u;
        setUser(u);
        if (!u) return;
        const remote = await loadRemote<StudyState>(u.uid).catch(() => null);
        setState((local) => {
          const merged = remote ? merge(local, { ...EMPTY, ...remote }) : local;
          writeLocal(merged);
          saveRemote(u.uid, merged).catch(() => {});
          return merged;
        });
      }),
    [],
  );

  const update = useCallback((fn: (s: StudyState) => StudyState) => {
    setState((prev) => {
      const next = fn(prev);
      writeLocal(next);
      if (userRef.current) saveRemote(userRef.current.uid, next).catch(() => {});
      return next;
    });
  }, []);

  // 문제별 응시 기록: unitId + 종류(fm/ck/bank) + qId → r1/r2 결과
  // key 형식: `${unitId}:${type}:${qId}`
  const recordAttempt = useCallback(
    (key: string, ok: boolean) =>
      update((s) => {
        const attempts = { ...(s.attempts ?? {}) };
        const prev = attempts[key] ?? {};
        const now = Date.now();
        const round: 'r1' | 'r2' = prev.r1 == null ? 'r1' : 'r2';
        attempts[key] = { ...prev, [round]: ok ? 'O' : 'X', lastAt: now };
        return { ...s, attempts };
      }),
    [update],
  );

  const resetAttempts = useCallback(
    (prefix: string) =>
      update((s) => {
        const attempts = { ...(s.attempts ?? {}) };
        for (const k of Object.keys(attempts)) if (k.startsWith(prefix)) delete attempts[k];
        return { ...s, attempts };
      }),
    [update],
  );

  const resetKeys = useCallback(
    (keys: string[]) =>
      update((s) => {
        const attempts = { ...(s.attempts ?? {}) };
        for (const k of keys) delete attempts[k];
        return { ...s, attempts };
      }),
    [update],
  );

  const recordQuiz = useCallback(
    (unitId: string, score: number, results: boolean[]) =>
      update((s) => {
        const prev = s.progress[unitId];
        const wrong = { ...s.wrong };
        const now = Date.now();
        results.forEach((ok, index) => {
          const key = `${unitId}:${index}`;
          if (ok) delete wrong[key];
          else wrong[key] = { key, unitId, index, count: (wrong[key]?.count ?? 0) + 1, lastWrong: now };
        });
        return {
          ...s,
          wrong,
          progress: {
            ...s.progress,
            [unitId]: { bestScore: Math.max(score, prev?.bestScore ?? 0), attempts: (prev?.attempts ?? 0) + 1, lastStudied: now },
          },
        };
      }),
    [update],
  );

  const resolveWrong = useCallback(
    (key: string) =>
      update((s) => {
        const wrong = { ...s.wrong };
        delete wrong[key];
        return { ...s, wrong };
      }),
    [update],
  );

  const toggleKnown = useCallback(
    (key: string) =>
      update((s) => {
        const knownTerms = { ...s.knownTerms };
        if (knownTerms[key]) delete knownTerms[key];
        else knownTerms[key] = true;
        return { ...s, knownTerms };
      }),
    [update],
  );

  return { state, user, recordQuiz, resolveWrong, toggleKnown, recordAttempt, resetAttempts, resetKeys };
};

export type StudyStore = ReturnType<typeof useStudyStore>;
