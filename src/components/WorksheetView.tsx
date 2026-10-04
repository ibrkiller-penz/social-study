import type React from 'react';
import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ClipboardCheck, Eye, EyeOff, Notebook, PenLine, RotateCcw } from 'lucide-react';
import type { Worksheet } from '../types';
import { CheckView } from './CheckView';
import { McqSet } from './McqSet';
import { CONCEPT_CHECKS } from '../data/concept_checks';
import { QUIZ } from '../data/quiz';
import { PrintButton } from './PrintButton';

type Mode = 'notes' | 'check' | 'quiz';

interface Props {
  sheets: Worksheet[];
  unitId: string;
  store: import('../store').StudyStore;
}

export const WorksheetView = ({ sheets, unitId, store }: Props) => {
  const checks = CONCEPT_CHECKS[unitId] ?? [];
  const quiz = useMemo(() => (QUIZ[unitId] ?? []).map((q, i) => ({ key: `${unitId}:qz:${i}`, ...q })), [unitId]);
  const [mode, setMode] = useState<Mode>('notes');

  const modes: { id: Mode; label: string; icon: typeof BookOpen; disabled?: boolean }[] = [
    { id: 'notes', label: '학습지', icon: Notebook, disabled: !sheets.length },
    { id: 'check', label: '개념 확인', icon: ClipboardCheck, disabled: !checks.length },
    { id: 'quiz', label: `퀴즈 ${quiz.length}`, icon: PenLine, disabled: !quiz.length },
  ];

  return (
    <div>
      <div className="no-print mb-4 flex gap-1 rounded-xl bg-slate-100 p-1">
        {modes.map(({ id, label, icon: Icon, disabled }) => (
          <button
            key={id}
            onClick={() => !disabled && setMode(id)}
            disabled={disabled}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              mode === id ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {mode === 'notes' && sheets.length > 0 && <NotesView sheets={sheets} />}
      {mode === 'check' && checks.length > 0 && <CheckView pages={checks} />}
      {mode === 'quiz' && quiz.length > 0 && (
        <div>
          <p className="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">학습지 내용으로 만든 5지선다 {quiz.length}문항이에요. 학습 모드에서는 고르는 즉시 정답과 해설을 확인할 수 있어요.</p>
          <McqSet items={quiz} store={store} printLabel="퀴즈 인쇄" />
        </div>
      )}
    </div>
  );
};

// ------------------------- 학습지(학습노트) 렌더러 -------------------------

type Segment = { kind: 'text'; text: string } | { kind: 'blank'; text: string; id: string };

const parseLine = (line: string, idPrefix: string): Segment[] => {
  const out: Segment[] = [];
  let i = 0;
  const re = /\[\[([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(line))) {
    if (m.index > i) out.push({ kind: 'text', text: line.slice(i, m.index) });
    out.push({ kind: 'blank', text: m[1], id: `${idPrefix}-${n++}` });
    i = m.index + m[0].length;
  }
  if (i < line.length) out.push({ kind: 'text', text: line.slice(i) });
  return out;
};

const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();

// 학습지 줄 표기: '|칸|칸|' 표 행, '## ' 자료 제목, '> ' 인용 박스, '![](경로)' 그림
type Item =
  | { kind: 'text'; segs: Segment[] }
  | { kind: 'row'; cells: Segment[][] }
  | { kind: 'title'; text: string }
  | { kind: 'quote'; segs: Segment[] }
  | { kind: 'img'; src: string };

const toItem = (line: string, id: string): Item => {
  if (line.startsWith('|')) return { kind: 'row', cells: line.slice(1, line.endsWith('|') ? -1 : undefined).split('|').map((c, ci) => parseLine(c.trim(), `${id}-c${ci}`)) };
  if (line.startsWith('## ')) return { kind: 'title', text: line.slice(3) };
  if (line.startsWith('> ')) return { kind: 'quote', segs: parseLine(line.slice(2), id) };
  const im = line.match(/^!\[\]\((.+)\)$/);
  if (im) return { kind: 'img', src: im[1] };
  return { kind: 'text', segs: parseLine(line, id) };
};

const itemBlanks = (it: Item) =>
  (it.kind === 'row' ? it.cells.flat() : it.kind === 'text' || it.kind === 'quote' ? it.segs : []).filter((s): s is Segment & { kind: 'blank' } => s.kind === 'blank');

// 칸 안의 '• 가 • 나' 는 줄을 나눠 보여 줌
const splitBullets = (segs: Segment[]): Segment[][] => {
  const out: Segment[][] = [[]];
  for (const sg of segs) {
    if (sg.kind === 'text' && sg.text.includes('•')) {
      sg.text.split(/\s*(?=•)/).forEach((part, k) => {
        if (k > 0 && out[out.length - 1].length) out.push([]);
        if (part) out[out.length - 1].push({ kind: 'text', text: part });
      });
    } else out[out.length - 1].push(sg);
  }
  return out.filter((l) => l.length);
};

type Render = (segs: Segment[]) => React.ReactNode;

const TableBlock = ({ rows, renderSegs }: { rows: Segment[][][]; renderSegs: Render }) => {
  const cols = Math.max(...rows.map((r) => r.length));
  const cellText = (c: Segment[]) => c.map((x) => x.text).join('');
  const headRow = cellText(rows[0][0] ?? []).trim() === '구분';
  return (
    <div className="print-avoid my-2 overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px] leading-7 [&_input]:max-w-[6.5em] [&_input]:text-[14px]">
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className={headRow && ri === 0 ? 'bg-teal-50 font-semibold text-teal-900' : ''}>
              {r.map((c, ci) => {
                const span = ci === r.length - 1 ? cols - r.length + 1 : 1;
                const head = (headRow && ri === 0) || (ci === 0 && cols > 1 && r.length > 1 && cellText(c).trim().length <= 14);
                return (
                  <td key={ci} colSpan={span} className={`border border-slate-300 px-2 py-1.5 align-top ${head ? 'bg-slate-50 text-center font-semibold' : ''} ${cols === 1 || r.length === 1 ? 'text-center' : ''}`}>
                    {splitBullets(c).map((l, k) => (
                      <div key={k}>{renderSegs(l)}</div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const asset = (src: string) => `${import.meta.env.BASE_URL}${src}`;

// 연속된 표 행 / 인용 줄을 묶어서 그림
const Blocks = ({ items, renderSegs, bullets }: { items: Item[]; renderSegs: Render; bullets: boolean }) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < items.length; ) {
    const it = items[i];
    if (it.kind === 'row') {
      const rs: Segment[][][] = [];
      while (i < items.length && items[i].kind === 'row') rs.push((items[i++] as Extract<Item, { kind: 'row' }>).cells);
      out.push(<TableBlock key={i} rows={rs} renderSegs={renderSegs} />);
    } else if (it.kind === 'quote') {
      const qs: Segment[][] = [];
      while (i < items.length && items[i].kind === 'quote') qs.push((items[i++] as Extract<Item, { kind: 'quote' }>).segs);
      out.push(
        <div key={i} className="my-2 rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-[14px] leading-7">
          {qs.map((q, k) => <p key={k}>{renderSegs(q)}</p>)}
        </div>,
      );
    } else if (it.kind === 'img') {
      out.push(<img key={i} src={asset(it.src)} alt="자료" loading="lazy" className="mx-auto my-2 block h-auto max-h-[360px] w-auto max-w-full rounded" />);
      i++;
    } else if (it.kind === 'text') {
      out.push(
        bullets ? (
          <BulletLine key={i} segs={it.segs} renderSegs={renderSegs} />
        ) : (
          <p key={i}>{renderSegs(it.segs)}</p>
        ),
      );
      i++;
    } else i++;
  }
  return <>{out}</>;
};

// '• …' 은 점 하나로, '① …' 은 소제목처럼(점 없이 굵게) 표시
const BulletLine = ({ segs, renderSegs }: { segs: Segment[]; renderSegs: Render }) => {
  const first = segs[0];
  const lead = first?.kind === 'text' ? first.text.trimStart() : '';
  if (lead.startsWith('•')) {
    const rest: Segment[] = [{ kind: 'text', text: lead.replace(/^•\s*/, '') }, ...segs.slice(1)];
    return (
      <div className="flex gap-2 pl-4">
        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
        <span className="flex-1">{renderSegs(rest)}</span>
      </div>
    );
  }
  if (/^[①-⑳]/.test(lead)) {
    const k = lead.indexOf(':');
    if (k > 0 && k < 40 && first?.kind === 'text')
      return (
        <div>
          <span className="font-semibold text-slate-800">{lead.slice(0, k + 1)}</span>
          {renderSegs([{ kind: 'text', text: lead.slice(k + 1) }, ...segs.slice(1)])}
        </div>
      );
    return <div className="font-semibold text-slate-800">{renderSegs(segs)}</div>;
  }
  return (
    <div className="flex gap-2">
      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
      <span className="flex-1">{renderSegs(segs)}</span>
    </div>
  );
};

const SectionBody = ({ items, material, renderSegs }: { items: Item[]; material: boolean; renderSegs: Render }) => {
  if (!material) return <div className="space-y-2.5 text-[15px] leading-8"><Blocks items={items} renderSegs={renderSegs} bullets /></div>;
  // 학습 자료: '## 자료 N 제목' 단위 카드
  const groups: { title?: string; items: Item[] }[] = [];
  for (const it of items) {
    if (it.kind === 'title') groups.push({ title: it.text, items: [] });
    else (groups[groups.length - 1] ?? (groups[groups.push({ items: [] }) - 1])).items.push(it);
  }
  return (
    <div className="space-y-3">
      {groups.map((g, gi) => {
        const m = g.title?.match(/^(자료\s*\d+)\s*(.*)$/);
        return (
          <div key={gi} className="print-avoid rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-[14.5px] leading-7">
            {g.title && (
              <div className="mb-1.5 flex items-baseline gap-2">
                {m && <span className="shrink-0 rounded bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">{m[1]}</span>}
                <span className="font-bold text-slate-800">{m ? m[2] : g.title}</span>
              </div>
            )}
            <Blocks items={g.items} renderSegs={renderSegs} bullets={false} />
          </div>
        );
      })}
    </div>
  );
};

const NotesView = ({ sheets }: { sheets: Worksheet[] }) => {
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const sheet = sheets[pos];
  const rows = useMemo(
    () =>
      sheet.sections.map((sec, si) => ({
        ...sec,
        items: sec.lines.map((line, li) => toItem(line, `${pos}-${si}-${li}`)),
      })),
    [sheet, pos],
  );

  const allBlanks = rows.flatMap((r) => r.items.flatMap(itemBlanks));
  const correctCount = allBlanks.filter((b) => normalize(answers[b.id] ?? '') === normalize(b.text)).length;
  const blankProps = (seg: Segment & { kind: 'blank' }) => ({
    id: seg.id,
    answer: seg.text,
    value: answers[seg.id] ?? '',
    onChange: (v: string) => setAnswers((a) => ({ ...a, [seg.id]: v })),
    checked,
    revealed: showAll,
  });
  const renderSegs = (segs: Segment[]) =>
    segs.map((seg, i) => (seg.kind === 'text' ? <span key={i}>{seg.text}</span> : <BlankInput key={seg.id} {...blankProps(seg)} />));

  const reset = () => {
    setAnswers({});
    setChecked(false);
    setShowAll(false);
  };
  const gotoSheet = (i: number) => {
    reset();
    setPos(i);
  };

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center gap-2 overflow-x-auto">
        {sheets.map((s, i) => (
          <button
            key={s.title}
            onClick={() => gotoSheet(i)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${i === pos ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-teal-300'}`}
          >
            {(s.title.split('—')[1] ?? s.title).trim().replace(/^(주제\s*\d+).*/, '$1')}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-teal-800">{sheet.title}</h2>
        <div className="mt-1 text-xs text-slate-500">빈칸 {allBlanks.length}개 · 맞힌 답 {correctCount}개</div>

        <div className="mt-5 space-y-6">
          {rows.map((sec, si) => (
            <section key={si}>
              <h3 className="mb-2 font-bold text-slate-700">{sec.heading}</h3>
              <SectionBody items={sec.items} material={sec.heading === '학습 자료'} renderSegs={renderSegs} />
              {sec.annotations && sec.annotations.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm italic text-rose-600">
                  {sec.annotations.map((a, ai) => (
                    <li key={ai} className="flex gap-1"><span>✎</span><span>{a}</span></li>
                  ))}
                </ul>
              )}
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
          <PrintButton label="학습지 인쇄" />
          <PrintButton label="정답 포함 인쇄" onBefore={() => setShowAll(true)} />
        </div>
      </div>
    </div>
  );
};

interface BlankProps { id: string; answer: string; value: string; onChange: (v: string) => void; checked: boolean; revealed: boolean }
const BlankInput = ({ id, answer, value, onChange, checked, revealed }: BlankProps) => {
  const ok = normalize(value) === normalize(answer);
  const state = revealed ? 'reveal' : checked ? (ok ? 'ok' : 'wrong') : value ? 'typed' : 'idle';
  const width = Math.max(4, Math.min(14, answer.length + 1));
  return (
    <span className="inline-flex flex-col align-baseline">
      <input aria-label={id} value={revealed ? answer : value} readOnly={revealed} onChange={(e) => onChange(e.target.value)} style={{ width: `${width}em` }}
        className={`mx-1 rounded border-b-2 bg-transparent px-1 text-center text-[15px] font-semibold outline-none transition ${
          state === 'ok' ? 'border-emerald-500 text-emerald-700' : state === 'wrong' ? 'border-rose-500 text-rose-700' : state === 'reveal' ? 'border-teal-500 text-teal-700' : state === 'typed' ? 'border-slate-500 text-slate-800' : 'border-slate-300 text-slate-400 focus:border-teal-500'
        }`}
      />
      {checked && !ok && !revealed && <span className="mx-1 mt-0.5 text-center text-xs text-emerald-600">→ {answer}</span>}
    </span>
  );
};
