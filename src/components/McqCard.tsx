import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import type { AttemptRecord, QStruct } from '../types';
import { QuestionBody, StructBody, cleanChoice } from './QuestionText';

const LABELS = '①②③④⑤⑥';

interface Props {
  index?: number; // 화면 표시 번호
  tag?: string; // 출처 등 작은 배지
  q: string;
  choices: string[];
  answer: number;
  explain?: string;
  picked?: number;
  reveal: boolean; // 정답·해설 표시 여부
  locked?: boolean; // 선택 변경 불가
  attempt?: AttemptRecord;
  onPick: (i: number) => void;
  forceExplain?: boolean;
  s?: QStruct; // HWP 원본 구조 (있으면 이걸로 렌더링)
}

export const AttemptBadges = ({ a }: { a?: AttemptRecord }) =>
  a && (a.r1 || a.r2) ? (
    <span className="flex gap-1 text-[11px]">
      {a.r1 && <span className={`rounded-full px-2 py-0.5 font-bold ${a.r1 === 'O' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>1차 {a.r1}</span>}
      {a.r2 && <span className={`rounded-full px-2 py-0.5 font-bold ${a.r2 === 'O' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>2차 {a.r2}</span>}
    </span>
  ) : null;

export const McqCard = ({ index, tag, q, choices, answer, explain, picked, reveal, locked, attempt, onPick, forceExplain, s }: Props) => {
  const ok = picked === answer;
  const [open, setOpen] = useState(false);
  const showExp = forceExplain || open;
  return (
    <li className="print-avoid rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {index != null && <span className="rounded-full bg-teal-50 px-2 py-0.5 font-bold text-teal-700">{index}번</span>}
        {tag && <span>{tag}</span>}
        <span className="ml-auto">
          <AttemptBadges a={attempt} />
        </span>
      </div>
      {s ? <StructBody s={s} /> : <QuestionBody text={q} showNumber={index == null} />}
      <div className="mt-3 space-y-1.5">
        {(s ? s.choices : choices).map((c, j) => {
          const state = reveal ? (j === answer ? 'answer' : picked === j ? 'wrong' : 'dim') : picked === j ? 'picked' : 'idle';
          return (
            <button
              key={j}
              type="button"
              disabled={locked}
              onClick={() => onPick(j)}
              className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-[14px] leading-6 transition ${
                state === 'idle'
                  ? 'border-slate-200 hover:border-teal-400 active:bg-teal-50'
                  : state === 'picked'
                    ? 'border-teal-500 bg-teal-50'
                    : state === 'answer'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : state === 'wrong'
                        ? 'border-rose-400 bg-rose-50 text-rose-900'
                        : 'border-slate-100 text-slate-400'
              }`}
            >
              <span className="shrink-0 font-bold">{LABELS[j]}</span>
              <span className="flex-1 whitespace-pre-line">{cleanChoice(c)}</span>
            </button>
          );
        })}
      </div>
      {reveal && (
        <div className={`mt-3 rounded-lg p-3 text-sm leading-6 ${picked == null ? 'bg-slate-50 text-slate-700' : ok ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
          <div className="flex items-center gap-1 font-bold">
            {picked == null ? null : ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {picked == null ? '' : ok ? '정답! ' : '오답 · '}정답은 {LABELS[answer]}
            {explain && !forceExplain && (
              <button type="button" onClick={() => setOpen((v) => !v)} className="no-print ml-auto flex items-center gap-0.5 rounded-md bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                해설 {open ? '닫기' : '보기'} {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
          {explain && showExp && <div className="mt-2 whitespace-pre-line border-t border-current/10 pt-2">{explain.replace(/^정답\s*[①②③④⑤]\s*/, '')}</div>}
        </div>
      )}
    </li>
  );
};
