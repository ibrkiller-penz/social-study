import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CURRENT_EXAM } from '../data/exam';
import { findUnit } from '../data';
import { PARTS, type PartId } from './PrintPage';

// 한국사2 사이트와 같은 「PDF로 저장하기」 창
export const PdfDialog = ({ unitId, onClose }: { unitId?: string; onClose: () => void }) => {
  const units = CURRENT_EXAM.teachers;
  const [sel, setSel] = useState<string[]>(units.filter((t) => !unitId || t.unitId === unitId).map((t) => t.unitId));
  const [parts, setParts] = useState<PartId[]>(['qz', 'fm', 'hwp', 'sn']);
  const [ans, setAns] = useState('1');
  const [q, setQ] = useState('1');
  const [cols, setCols] = useState('2');

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const label = (on: boolean) =>
    `inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${on ? 'border-teal-700 bg-teal-50 font-bold text-teal-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`;
  const short = (id: string) => {
    const t = units.find((x) => x.unitId === id)!;
    return `${t.unitLabel.replace('단원', '')} ${findUnit(id)?.unit.title ?? ''}`;
  };

  const open = () => {
    if (!sel.length || !parts.length) {
      alert('단원과 내용을 하나 이상 고르세요.');
      return;
    }
    const order = PARTS.map(([k]) => k).filter((k) => parts.includes(k));
    location.hash = `#/print?u=${units.map((t) => t.unitId).filter((u) => sel.includes(u)).join(',')}&p=${order.join(',')}&ans=${ans}&q=${q}&cols=${cols}`;
    onClose();
  };

  const Radio = ({ v, cur, set, children }: { v: string; cur: string; set: (v: string) => void; children: string }) => (
    <label className={label(cur === v)}>
      <input type="radio" checked={cur === v} onChange={() => set(v)} className="accent-teal-700" />
      {children}
    </label>
  );

  return createPortal(
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[88vh] w-full max-w-[560px] overflow-auto rounded-t-2xl bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))] sm:rounded-2xl">
        <h3 className="text-lg font-bold">PDF로 저장하기</h3>
        <p className="text-[12.5px] text-slate-500">
          내용을 고르면 A4 2단 인쇄용 화면이 열립니다. 인쇄 창에서 <b>「PDF로 저장」</b>을 고르세요.
        </p>

        <div className="mb-1 mt-3 text-sm font-bold">단원</div>
        <div className="flex flex-wrap gap-1.5">
          {units.map((t) => (
            <label key={t.unitId} className={label(sel.includes(t.unitId))}>
              <input type="checkbox" checked={sel.includes(t.unitId)} onChange={() => setSel(toggle(sel, t.unitId))} className="accent-teal-700" />
              {short(t.unitId)}
            </label>
          ))}
        </div>

        <div className="mb-1 mt-3 text-sm font-bold">내용</div>
        <div className="flex flex-wrap gap-1.5">
          {PARTS.map(([k, n]) => (
            <label key={k} className={label(parts.includes(k))}>
              <input type="checkbox" checked={parts.includes(k)} onChange={() => setParts(toggle(parts, k))} className="accent-teal-700" />
              {n}
            </label>
          ))}
        </div>

        <div className="mb-1 mt-3 text-sm font-bold">정답과 해설</div>
        <div className="flex flex-wrap gap-1.5">
          <Radio v="1" cur={ans} set={setAns}>문항 뒤 별도 페이지</Radio>
          <Radio v="0" cur={ans} set={setAns}>넣지 않음</Radio>
        </div>

        <div className="mb-1 mt-3 text-sm font-bold">학습지 정리 방식</div>
        <div className="flex flex-wrap gap-1.5">
          <Radio v="1" cur={q} set={setQ}>문제지 (번호 빈칸 + 정답은 뒤)</Radio>
          <Radio v="0" cur={q} set={setQ}>정리본 (빈칸 정답·필기 붉은 글씨)</Radio>
        </div>

        <div className="mb-1 mt-3 text-sm font-bold">단 나누기</div>
        <div className="flex flex-wrap gap-1.5">
          <Radio v="2" cur={cols} set={setCols}>2단 (용지 절약)</Radio>
          <Radio v="1" cur={cols} set={setCols}>1단 (큰 글씨)</Radio>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 font-bold text-slate-700">닫기</button>
          <button onClick={open} className="flex-1 rounded-xl bg-teal-700 py-3 font-bold text-white">인쇄용 화면 열기</button>
        </div>

        <div className="mb-1 mt-5 text-sm font-bold">미리 만든 PDF 바로 받기</div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {units.flatMap((t) => {
            const no = t.unitLabel.replace('단원', '');
            return [
              ['questions', `${no} 문항 모음`, '퀴즈·형성평가·미래엔·수능식·단답형 + 정답', '문항'],
              ['sheet', `${no} 빈칸 문제지`, '학습지 빈칸 + 개념 확인 + 정답', '빈칸문제지'],
              ['notes', `${no} 정리본`, '학습지 정리(정답·필기 붉은 글씨)', '정리본'],
            ].map(([k, title, desc, fname]) => (
              <a
                key={`${t.unitId}-${k}`}
                href={`${import.meta.env.BASE_URL}pdf/${t.unitId}-${k}.pdf`}
                download={`통합사회2_${no}_${fname}.pdf`}
                className="block rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600"
              >
                <b className="block text-[13px] text-slate-800">{title}</b>
                {desc}
              </a>
            ));
          })}
        </div>
        <p className="mt-2 text-[12.5px] text-slate-500">문항은 중간에 끊기지 않게 배치되고, 정답과 해설은 문항 뒤 새 페이지부터 나옵니다.</p>
      </div>
    </div>,
    document.body,
  );
};
