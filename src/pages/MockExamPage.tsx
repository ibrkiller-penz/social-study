import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { buildMockExam, type MockExam } from '../data/mockExam';
import type { StudyStore } from '../store';
import { QuestionBody, StructBody, cleanChoice } from '../components/QuestionText';
import { QSTRUCT } from '../data/qstruct';

interface Props {
  store: StudyStore;
}

const normalize = (s: string) => s.replace(/\s/g, '').replace(/[.,·]/g, '').toLowerCase();

// 서답형 키워드 점수: 핵심어를 몇 개 포함했는지로 계산
const gradeWritten = (answer: string, keywords: string[]) => {
  const n = normalize(answer);
  const hit = keywords.filter((k) => n.includes(normalize(k))).length;
  return { hit, total: keywords.length, ok: hit >= Math.ceil(keywords.length * 0.6) };
};

export const MockExamPage = ({ store }: Props) => {
  const [exam, setExam] = useState<MockExam | null>(null);
  const [choicePicks, setChoicePicks] = useState<Record<number, number>>({});
  const [written, setWritten] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState('00:00');

  useMemo(() => {
    if (!startAt || submitted) return;
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - startAt) / 1000);
      setElapsed(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(id);
  }, [startAt, submitted]);

  if (!exam) {
    return (
      <div className="mx-auto max-w-lg pt-6 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Clock className="mx-auto h-10 w-10 text-teal-600" />
          <h1 className="mt-3 text-xl font-bold">중간고사 모의고사</h1>
          <p className="mt-2 text-sm text-slate-500">
            문ㅈㅇ·이ㅈㅇ·윤ㄱㅅ·장ㅈㅅ 선생님 범위에서 <br />
            선택형 20문항 · 서답형 4문항이 출제됩니다.
          </p>
          <button
            onClick={() => {
              setExam(buildMockExam());
              setStartAt(Date.now());
            }}
            className="mt-6 w-full rounded-xl bg-teal-600 py-3 font-medium text-white hover:bg-teal-700"
          >
            시험 시작하기
          </button>
          <a href="#/" className="mt-3 inline-block text-xs text-slate-400 hover:text-slate-600">← 처음으로</a>
        </div>
      </div>
    );
  }

  const submit = () => {
    setSubmitted(true);
    // 문항별 1차/2차 기록 → 오답노트에 반영
    exam.choice.forEach((c, i) => {
      if (c.key && choicePicks[i] != null) store.recordAttempt(c.key, choicePicks[i] === c.question.answer);
    });
    // 오답노트에 반영: 실제 unit 퀴즈 인덱스가 아닌 문제이므로 wrong 저장은 하지 않고,
    // 각 선생님 단원별 최고 점수만 기록한다.
    const perTeacher: Record<string, { hit: number; total: number }> = {};
    exam.choice.forEach((c, i) => {
      const p = perTeacher[c.unitId] ?? (perTeacher[c.unitId] = { hit: 0, total: 0 });
      p.total += 1;
      if (choicePicks[i] === c.question.answer) p.hit += 1;
    });
    Object.entries(perTeacher).forEach(([unitId, { hit, total }]) => {
      const score = Math.round((hit / total) * 100);
      store.recordQuiz(unitId, score, new Array(total).fill(true));
    });
  };

  const choiceCorrect = exam.choice.filter((c, i) => choicePicks[i] === c.question.answer).length;
  const writtenGrades = exam.written.map((w, i) => gradeWritten(written[i] ?? '', w.keywords));
  const writtenCorrect = writtenGrades.filter((g) => g.ok).length;
  // 배점: 선택형 각 4점, 서답형 각 5점 → 총 100점
  const score = choiceCorrect * 4 + writtenCorrect * 5;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm">
        <a href="#/" className="inline-flex items-center gap-1 text-slate-500 hover:text-teal-600">
          <ArrowLeft className="h-4 w-4" /> 처음으로
        </a>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
          <Clock className="h-3.5 w-3.5" />
          {elapsed}
        </span>
      </div>

      {submitted && (
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 p-6 text-center text-white shadow-lg">
          <div className="text-sm text-teal-100">채점 결과</div>
          <div className="mt-1 text-5xl font-extrabold">{score}점</div>
          <div className="mt-2 text-sm text-teal-100">
            선택형 {choiceCorrect}/20 · 서답형 {writtenCorrect}/4 · 소요 시간 {elapsed}
          </div>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">선택형 (각 4점)</h2>
        <ol className="space-y-4">
          {exam.choice.map((c, i) => {
            const picked = choicePicks[i];
            const correct = c.question.answer;
            return (
              <li key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-baseline gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 font-bold text-teal-700">{i + 1}번</span>
                  <span>
                    {c.teacher} · {c.unitTitle}{c.source ? ` · ${c.source}` : ''}
                  </span>
                </div>
                <div className="mt-2">{c.key && QSTRUCT[c.key] ? <StructBody s={QSTRUCT[c.key]} /> : <QuestionBody text={c.question.q} />}</div>
                <div className="mt-3 space-y-1.5">
                  {(c.key && QSTRUCT[c.key] ? QSTRUCT[c.key].choices : c.question.choices).map((choice, j) => {
                    const state = !submitted
                      ? picked === j
                        ? 'picked'
                        : 'idle'
                      : j === correct
                        ? 'answer'
                        : picked === j
                          ? 'wrong'
                          : 'dim';
                    return (
                      <label
                        key={j}
                        className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                          state === 'idle'
                            ? 'border-slate-200 hover:border-teal-400'
                            : state === 'picked'
                              ? 'border-teal-500 bg-teal-50'
                              : state === 'answer'
                                ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                : state === 'wrong'
                                  ? 'border-rose-400 bg-rose-50 text-rose-800'
                                  : 'border-slate-100 text-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${i}`}
                          checked={picked === j}
                          disabled={submitted}
                          onChange={() => setChoicePicks((p) => ({ ...p, [i]: j }))}
                          className="mt-1"
                        />
                        <span className="font-bold text-slate-400">{'①②③④⑤'[j]}</span>
                        <span className="flex-1 whitespace-pre-line">{cleanChoice(choice)}</span>
                      </label>
                    );
                  })}
                </div>
                {submitted && (
                  <div
                    className={`mt-3 rounded-lg p-3 text-sm ${
                      picked === correct ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold">
                      {picked === correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      정답 {'①②③④⑤'[correct]}
                    </div>
                    <div className="mt-1 whitespace-pre-line">{c.question.explain.replace(/^정답\s*[:：]?\s*[①②③④⑤]\s*/, '')}</div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">서답형 (각 5점)</h2>
        <ol className="space-y-4">
          {exam.written.map((w, i) => {
            const g = writtenGrades[i];
            return (
              <li key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-teal-700">서답형 {i + 1}</div>
                <p className="mt-1 font-semibold leading-relaxed">{w.q}</p>
                <textarea
                  value={written[i] ?? ''}
                  disabled={submitted}
                  onChange={(e) => setWritten((p) => ({ ...p, [i]: e.target.value }))}
                  rows={2}
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="답을 입력하세요"
                />
                {submitted && (
                  <div className={`mt-3 rounded-lg p-3 text-sm ${g.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
                    <div className="flex items-center gap-1 font-bold">
                      {g.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      모범 답안: {w.answer}
                    </div>
                    <div className="mt-1">
                      핵심어 {g.hit}/{g.total}개 포함 {g.ok ? '· 정답 처리' : '· 부분 답안'}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="sticky bottom-4 mt-8">
        {!submitted ? (
          <button
            onClick={submit}
            className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white shadow-lg hover:bg-slate-800"
          >
            답안 제출하고 채점하기
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setExam(buildMockExam());
                setChoicePicks({});
                setWritten({});
                setSubmitted(false);
                setStartAt(Date.now());
                setElapsed('00:00');
                window.scrollTo(0, 0);
              }}
              className="flex-1 rounded-xl bg-teal-600 py-3 font-medium text-white shadow-lg hover:bg-teal-700"
            >
              새 문제로 다시 시험 보기
            </button>
            <a
              href="#/"
              className="rounded-xl bg-slate-100 px-4 py-3 text-center font-medium text-slate-700 shadow hover:bg-slate-200"
            >
              처음으로
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
