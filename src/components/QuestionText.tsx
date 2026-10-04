import type { QBlock, QStruct } from '../types';

// 문제 원문을 [안내문 · 발문 · 제시문 박스 · <보기> 박스]로 나눠서 보여준다.
// 원본(HWP 추출 / 직접 작성)마다 형식이 달라서, 줄바꿈·물음표·<보기> 표지를 기준으로 추정해서 나눈다.

interface Parsed {
  number?: string;
  instruction?: string; // [02~04] 다음 글을 읽고 물음에 답하시오.
  stem: string; // 발문 (…것은?)
  material: string[]; // 제시문 줄
  bogi: string[]; // <보기> 항목
}

const BOGI_RE = /\s*(?:▮\s*보기\s*▮|<\s*보기\s*>(?!\s*(?:에\s*서|를|의|와|로))|\|\s*보기\s*\||〈\s*보기\s*〉(?!\s*(?:에\s*서|를|의|와|로)))\s*/;
const INSTR_RE = /^(\[\d+\s*[~∼]\s*\d+\]\s*[^.]*?(?:답하시오|물음에 답하시오)\.?)\s*/;

export const parseQuestion = (raw: string): Parsed => {
  let t = tidy(raw.replace(/\r/g, '')).trim();
  let number: string | undefined;
  const num = t.match(/^(\d{1,2})[.\s]\s*/);
  if (num) {
    number = num[1].replace(/^0/, '');
    t = t.slice(num[0].length);
  }
  let instruction: string | undefined;
  const ins = t.match(INSTR_RE);
  if (ins) {
    instruction = ins[1];
    t = t.slice(ins[0].length);
  }

  // <보기> 분리
  let bogiText = '';
  const bm = t.match(BOGI_RE);
  if (bm && bm.index != null) {
    bogiText = t.slice(bm.index + bm[0].length);
    t = t.slice(0, bm.index);
  }

  const lines = t.split(/\n/).map((l) => l.trim()).filter(Boolean);
  let stem = '';
  const material: string[] = [];
  // 물음표가 빠진 원문: '…것은 ' 뒤에서 끊고 ?를 붙인다
  if (!lines.some((l) => /[?？]/.test(l))) {
    for (let li = 0; li < lines.length; li++) {
      const mm = lines[li].match(/^(.{4,120}?(?:것은|것만을[^.]{0,30}?것은|고른 것은|하는가|무엇인가))(?=\s)/);
      if (mm) {
        lines[li] = mm[1] + '?' + lines[li].slice(mm[1].length);
        break;
      }
    }
  }
  const qIdx = lines.findIndex((l) => /[?？]/.test(l));
  if (qIdx === -1) {
    stem = lines.join(' ');
  } else {
    let line = lines[qIdx];
    let cut = line.search(/[?？]/) + 1;
    // '…고른 것은 (제시문…)?' 처럼 발문 뒤 물음표가 빠지고 제시문 속 ?가 먼저 잡힌 경우
    const k = line.match(/^.{4,140}?것은(?=\s)/);
    if (k && k[0].length + 20 < cut) {
      line = k[0] + '?' + line.slice(k[0].length);
      lines[qIdx] = line;
      cut = k[0].length + 1;
    }
    const head = line.slice(0, cut).trim();
    const tail = line.slice(cut).trim();
    if (qIdx === lines.length - 1 && !tail && qIdx > 0) {
      // 제시문이 먼저, 발문이 마지막 줄
      stem = head;
      material.push(...lines.slice(0, qIdx));
    } else {
      stem = head;
      material.push(...lines.slice(0, qIdx));
      if (tail) material.push(tail);
      material.push(...lines.slice(qIdx + 1));
    }
  }

  // 보기 뒤에 이어진 발문이 있을 수 있음 → 보기 항목만 ㄱ.ㄴ.ㄷ. 기준으로 쪼갬
  const bogi = bogiText
    ? bogiText
        .split(/\s*(?=[ㄱ-ㅎ]\s*\.\s)/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return { number, instruction, stem, material: expandMaterial(material), bogi };
};

// 한 줄로 붙은 제시문을 (가)/(나), 갑:/을: 단위로 줄바꿈
const expandMaterial = (lines: string[]): string[] => {
  const out: string[] = [];
  for (const l of lines) {
    if (l.includes(' | ')) {
      out.push(l);
      continue;
    }
    const parts = l
      .replace(/\s+(?=\((?:가|나|다|라|마)\)\s)/g, '\n')
      .replace(/\s+(?=(?:갑|을|병|정|무|A|B|C|D|교사|학생)\s?:\s)/g, '\n')
      .replace(/\s*(?=[•⦁]\s)/g, '\n')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    out.push(...parts);
  }
  return out;
};

// HWP 줄바꿈 때문에 생긴 어절 중간 공백 일부 복구
export const tidy = (s: string) =>
  s
    .replace(/ (다|어|요)([.,])/g, '$1$2')
    .replace(/것 만을/g, '것만을')
    .replace(/\(\s+([가-라])\)/g, '($1)')
    .replace(/“\s+/g, '“')
    .replace(/\s+”/g, '”')
    .replace(/‘\s+/g, '‘')
    .replace(/\s+’/g, '’');

// 선택지 앞의 ①② 등 중복 번호 제거
export const cleanChoice = (c: string) => tidy(c).replace(/^\s*[①②③④⑤⑴⑵⑶⑷⑸]\s*/, '').trim();

const MaterialBlock = ({ lines }: { lines: string[] }) => {
  // 연속된 표 줄(|)은 표로
  const blocks: ({ type: 'table'; rows: string[][] } | { type: 'text'; text: string })[] = [];
  for (const l of lines) {
    if (l.includes(' | ')) {
      const cells = l.split('|').map((c) => c.trim());
      const last = blocks[blocks.length - 1];
      if (last && last.type === 'table') last.rows.push(cells);
      else blocks.push({ type: 'table', rows: [cells] });
    } else {
      blocks.push({ type: 'text', text: l });
    }
  }
  return (
    <div className="space-y-2">
      {blocks.map((b, i) =>
        b.type === 'table' ? (
          <div key={i} className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri} className={ri === 0 ? 'bg-slate-100 font-semibold' : ''}>
                    {r.map((c, ci) => (
                      <td key={ci} className="border border-slate-300 px-2 py-1 text-center">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : /생략/.test(b.text) && b.text.length < 60 ? (
          <p key={i} className="text-xs italic text-slate-400">{b.text}</p>
        ) : (
          <p key={i}>{b.text}</p>
        ),
      )}
    </div>
  );
};

export const QuestionBody = ({ text, showNumber = true, size = 'md' }: { text: string; showNumber?: boolean; size?: 'md' | 'sm' }) => {
  const p = parseQuestion(text);
  const stemCls = size === 'md' ? 'text-[15px] font-semibold leading-relaxed' : 'text-[15px] leading-relaxed';
  return (
    <div>
      {p.instruction && <p className="mb-1 text-xs font-medium text-slate-500">{p.instruction}</p>}
      <p className={stemCls}>
        {showNumber && p.number && <span className="mr-1 text-teal-700">{p.number}.</span>}
        {p.stem}
      </p>
      {p.material.length > 0 && (
        <div className="mt-3 rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-[14px] leading-7 text-slate-800">
          <MaterialBlock lines={p.material} />
        </div>
      )}
      {p.bogi.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] leading-7">
          <div className="mb-1 text-center text-xs font-bold tracking-widest text-slate-500">〈 보 기 〉</div>
          {p.bogi.map((b, i) => (
            <p key={i}>{b}</p>
          ))}
        </div>
      )}
    </div>
  );
};

const asset = (src: string) => `${import.meta.env.BASE_URL}${src}`;

const Img = ({ src }: { src: string }) => (
  <img src={asset(src)} alt="자료" loading="lazy" className="mx-auto my-1 block h-auto max-h-[420px] w-auto max-w-full rounded" />
);

const Lines = ({ lines }: { lines: string[] }) => (
  <>
    {lines.map((l, i) =>
      /생략/.test(l) && l.length < 60 ? (
        <p key={i} className="text-xs italic text-slate-400">{l}</p>
      ) : /^(자료|사회 복지 제도 탐구 보고서|.{2,20}(보고서|계획서|활동지))$/.test(l) && i === 0 ? (
        <p key={i} className="text-center font-bold">{l}</p>
      ) : (
        <p key={i}>{l}</p>
      ),
    )}
  </>
);

const Block = ({ b }: { b: QBlock }) => {
  switch (b.t) {
    case 'text':
      return <p>{b.text}</p>;
    case 'box':
      return (
        <div className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5">
          <Lines lines={b.lines} />
          {b.imgs?.map((s) => <Img key={s} src={s} />)}
          {b.children && (
            <div className="mt-2 space-y-2">
              {b.children.map((c, i) => <Block key={i} b={c} />)}
            </div>
          )}
        </div>
      );
    case 'imgs':
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-2">
          {b.srcs.map((s) => <Img key={s} src={s} />)}
        </div>
      );
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <tbody>
              {b.rows.map((r, ri) => (
                <tr key={ri} className={ri === 0 ? 'bg-slate-100 font-semibold' : ''}>
                  {r.map((c, ci) => (
                    <td key={ci} className="border border-slate-300 px-2 py-1 text-center">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'bogi':
      return (
        <div className="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <div className="mb-1 text-center text-xs font-bold tracking-widest text-slate-500">〈 보 기 〉</div>
          {b.items.map((it, i) => <p key={i}>{it}</p>)}
        </div>
      );
  }
};

// HWP 레이아웃을 그대로 살린 구조화 문항
export const StructBody = ({ s, number }: { s: QStruct; number?: string }) => (
  <div>
    {s.instruction && <p className="mb-1 text-xs font-medium text-slate-500">{s.instruction}</p>}
    <p className="text-[15px] font-semibold leading-relaxed">
      {number && <span className="mr-1 text-teal-700">{number}.</span>}
      {s.stem}
    </p>
    {s.blocks.length > 0 && (
      <div className="mt-3 space-y-2 text-[14px] leading-7 text-slate-800">
        {s.blocks.map((b, i) => <Block key={i} b={b} />)}
      </div>
    )}
  </div>
);
