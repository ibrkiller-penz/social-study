import { useEffect, useMemo, type ReactNode } from 'react';
import './print.css';
import type { CheckPage, QBlock, QStruct, Question, Worksheet, WrittenQuestion } from '../types';
import { CURRENT_EXAM } from '../data/exam';
import { findUnit } from '../data';
import { FORMATIVE } from '../data/formative';
import { QUIZ } from '../data/quiz';
import { CONCEPT_CHECKS } from '../data/concept_checks';
import { TEACHER_BANKS } from '../data/banks';
import { QSTRUCT } from '../data/qstruct';
import { parseQuestion, cleanChoice, tidy } from '../components/QuestionText';

// 한국사2 사이트의 print.html 과 같은 방식의 A4 인쇄용 화면.
// #/print?u=is2-1,is2-2&p=notes,ck,qz,fm,hwp,sn,short&ans=1&q=1&cols=2&auto=1

export const PARTS = [
  ['notes', '학습지 정리'],
  ['ck', '개념 확인'],
  ['qz', '학습지 퀴즈'],
  ['fm', '형성평가'],
  ['hwp', '미래엔 문항'],
  ['sn', '수능식 문항'],
  ['short', '단답형'],
] as const;
export type PartId = (typeof PARTS)[number][0];
const NAME = Object.fromEntries(PARTS) as Record<PartId, string>;
const MARK = '①②③④⑤';
const asset = (src: string) => `${import.meta.env.BASE_URL}${src}`;

interface Mcq {
  q: string;
  choices: string[];
  answer: number;
  explain?: string;
  s?: QStruct;
  sub?: string; // 소제목(형성평가 주제)
}

const stripAns = (e = '') => e.replace(/^\s*정답\s*[:：]?\s*[①②③④⑤]\s*/, '').trim();

const unitInfo = (unitId: string) => {
  const t = CURRENT_EXAM.teachers.find((x) => x.unitId === unitId);
  const u = findUnit(unitId)?.unit;
  return { no: t?.unitLabel.replace('단원', '') ?? '', title: u?.title ?? unitId, teacher: t ? `${t.teacher}T` : '', ranges: t?.ranges.join(' · ') ?? '' };
};

const mcqList = (unitId: string, p: PartId): Mcq[] => {
  const bank = TEACHER_BANKS.find((b) => b.unitId === unitId);
  const mk = (q: Question, key: string, sub?: string): Mcq => ({ q: q.q, choices: q.choices, answer: q.answer, explain: q.explain, s: QSTRUCT[key], sub });
  if (p === 'qz') return (QUIZ[unitId] ?? []).map((q, i) => mk(q, `${unitId}:qz:${i}`));
  if (p === 'fm')
    return (FORMATIVE[unitId] ?? []).flatMap((s, pos) =>
      s.questions.map((q, i) => mk(q, `${unitId}:fm:${pos}:${i}`, s.title.replace(/\s*—\s*형성평가\s*$/, ''))),
    );
  if (p === 'hwp') return (bank?.hwp ?? []).map((q, i) => mk(q, `${unitId}:bank:hwp:${i}`));
  if (p === 'sn') return (bank?.suneung ?? []).map((q, i) => mk(q, `${unitId}:bank:sn:${i}`));
  return [];
};

const choiceClass = (ch: string[]) => {
  const L = Math.max(...ch.map((c) => cleanChoice(c).length));
  if (L <= 3) return 'c5';
  if (L <= 7) return 'c3';
  if (L <= 13) return 'c2';
  return '';
};

// ── 문항 본문 ──
const Block = ({ b }: { b: QBlock }): ReactNode => {
  if (b.t === 'text') return <p>{b.text}</p>;
  if (b.t === 'imgs') return <div className="src">{b.srcs.map((s) => <img key={s} src={asset(s)} alt="" />)}</div>;
  if (b.t === 'bogi')
    return (
      <div className="src">
        <span className="cap">〈보기〉</span>
        {b.items.map((x, i) => <p key={i}>{x}</p>)}
      </div>
    );
  if (b.t === 'table')
    return (
      <div className="src">
        <table>
          <tbody>
            {b.rows.map((r, ri) => (
              <tr key={ri} className={ri === 0 ? 'h' : ''}>{r.map((c, ci) => <td key={ci}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <div className="src">
      {b.lines.map((l, i) => <p key={i}>{l}</p>)}
      {b.imgs?.map((s) => <img key={s} src={asset(s)} alt="" />)}
      {b.children?.map((c, i) => <Block key={i} b={c} />)}
    </div>
  );
};

const QBody = ({ m, n }: { m: Mcq; n: number }) => {
  if (m.s) {
    return (
      <>
        {m.s.instruction && <div className="ins">{m.s.instruction}</div>}
        <div className="stem"><span className="n">{n}.</span>{m.s.stem}</div>
        {m.s.blocks.map((b, i) => <Block key={i} b={b} />)}
      </>
    );
  }
  const p = parseQuestion(m.q);
  const rows = p.material;
  const table = rows.filter((l) => l.includes(' | '));
  return (
    <>
      {p.instruction && <div className="ins">{p.instruction}</div>}
      <div className="stem"><span className="n">{n}.</span>{p.stem}</div>
      {rows.length > 0 && (
        <div className="src">
          {rows.filter((l) => !l.includes(' | ')).map((l, i) => <p key={i}>{l}</p>)}
          {table.length > 0 && (
            <table>
              <tbody>
                {table.map((l, ri) => (
                  <tr key={ri} className={ri === 0 ? 'h' : ''}>{l.split('|').map((c, ci) => <td key={ci}>{c.trim()}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {p.bogi.length > 0 && (
        <div className="src">
          <span className="cap">〈보기〉</span>
          {p.bogi.map((x, i) => <p key={i}>{x}</p>)}
        </div>
      )}
    </>
  );
};

const McqItem = ({ m, n }: { m: Mcq; n: number }) => {
  const ch = m.s?.choices ?? m.choices;
  return (
    <div className="q">
      <QBody m={m} n={n} />
      <ol className={`ch ${choiceClass(ch)}`}>
        {ch.map((c, j) => (
          <li key={j}><span className="m">{MARK[j]}</span><span>{cleanChoice(c)}</span></li>
        ))}
      </ol>
    </div>
  );
};

// ── 학습지 정리 (빈칸 [[답]]) ──
type BK = string[];
const inline = (text: string, blank: boolean, bk: BK): ReactNode[] => {
  const out: ReactNode[] = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > i) out.push(text.slice(i, m.index));
    if (blank) {
      bk.push(m[1]);
      const w = Math.min(14, Math.max(2.6, m[1].length * 0.95 + 1.2));
      out.push(<span key={m.index} className="bk" style={{ minWidth: `${w}em` }}><i>{bk.length}</i></span>);
    } else out.push(<span key={m.index} className="hw">{m[1]}</span>);
    i = m.index + m[0].length;
  }
  if (i < text.length) out.push(text.slice(i));
  return out;
};

const notesHtml = (sheets: Worksheet[], blank: boolean, bk: BK): ReactNode => {
  const lineEl = (l: string, k: number) => {
    const t = l.trim();
    const cls = t.startsWith('•') ? 'b' : /^[①-⑳]/.test(t) ? 's' : '';
    if (cls === 's') {
      const c = t.indexOf(':');
      const head = c > 0 && c < 40 ? t.slice(0, c + 1) : t;
      return <p key={k} className="s"><b>{inline(head, blank, bk)}</b>{inline(t.slice(head.length), blank, bk)}</p>;
    }
    return <p key={k} className={cls}>{inline(t, blank, bk)}</p>;
  };
  // 연속된 표 행, 자료 카드를 묶어 렌더링
  const body = (lines: string[], material: boolean): ReactNode[] => {
    const out: ReactNode[] = [];
    let i = 0;
    let card: ReactNode[] | null = null;
    const push = (n: ReactNode) => (card ? card.push(n) : out.push(n));
    const flush = () => {
      if (card) out.push(<div key={`c${i}`} className="src">{card}</div>);
      card = null;
    };
    while (i < lines.length) {
      const l = lines[i];
      if (l.startsWith('|')) {
        const rows: string[][] = [];
        while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++].replace(/^\||\|$/g, '').split('|'));
        const cols = Math.max(...rows.map((r) => r.length));
        const head = rows[0][0]?.trim() === '구분';
        push(
          <div key={`t${i}`} className="tbl">
            <table>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri} className={head && ri === 0 ? 'h' : ''}>
                    {r.map((c, ci) => (
                      <td key={ci} colSpan={ci === r.length - 1 ? cols - r.length + 1 : 1} className={ci === 0 && r.length > 1 && !(head && ri === 0) && c.replace(/\[\[|\]\]/g, '').trim().length <= 14 ? 'h' : ''}>
                        {c.split(/\s*(?=•)/).map((x, k) => <div key={k}>{inline(x.trim(), blank, bk)}</div>)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }
      if (material && l.startsWith('## ')) {
        flush();
        card = [<span key="ttl" className="ttl">{l.slice(3)}</span>];
        i++;
        continue;
      }
      if (l.startsWith('> ')) {
        const qs: string[] = [];
        while (i < lines.length && lines[i].startsWith('> ')) qs.push(lines[i++].slice(2));
        push(<div key={`q${i}`} className="q2">{qs.map((x, k) => <p key={k}>{inline(x, blank, bk)}</p>)}</div>);
        continue;
      }
      const im = l.match(/^!\[\]\((.+)\)$/);
      if (im) push(<img key={`i${i}`} src={asset(im[1])} alt="" />);
      else push(lineEl(l, i));
      i++;
    }
    flush();
    return out;
  };
  return (
    <div className="notes">
      {sheets.map((sh, si) => (
        <div key={si}>
          <h3>{sh.title.replace(/^학습지\s*—\s*/, '')}</h3>
          {sh.sections.map((sec, k) => (
            <div key={k}>
              <h4>{sec.heading}</h4>
              {body(sec.lines, sec.heading === '학습 자료')}
              {!blank && sec.annotations?.map((a, ai) => <p key={ai} className="memo">✎ {a}</p>)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ── 개념 확인 ──
const ckHtml = (pages: CheckPage[], ans: string[]): ReactNode => {
  let n = 0;
  return pages.map((pg, pi) => (
    <div key={pi}>
      <div className="sub-h">{pg.title.replace(/^개념 확인 문제\s*—\s*/, '')}</div>
      {pg.checks.map((g, gi) => {
        const pool = g.problems.filter((p) => p.kind === 'match').map((p) => (p.kind === 'match' ? p.right : ''));
        return (
          <div key={gi}>
            <p style={{ margin: '3pt 0 2pt', fontWeight: 700, fontSize: '8.6pt' }}>{g.title}</p>
            {pool.length > 0 && <div className="pool">〈보기〉 {[...pool].sort().join(' / ')}</div>}
            {g.problems.map((p, k) => {
              n++;
              if (p.kind === 'ox') {
                ans.push(p.answer);
                return <div key={k} className="ck"><span className="n">{n}.</span><span>{tidy(p.q).replace(/^\d+\s*/, '')} <span className="opt">( O · X )</span></span></div>;
              }
              if (p.kind === 'choose' || p.kind === 'pick') {
                const opts = p.kind === 'choose' ? p.options : p.parts;
                ans.push(opts[p.answer]);
                return <div key={k} className="ck"><span className="n">{n}.</span><span>{tidy(p.q).replace(/^\d+\s*/, '')} <span className="opt">( {opts.join(' / ')} )</span></span></div>;
              }
              ans.push(p.right);
              return <div key={k} className="ck"><span className="n">{n}.</span><span>{p.left.replace(/^\d+\s*/, '')} → <span className="bk" style={{ minWidth: '8em' }} /></span></div>;
            })}
          </div>
        );
      })}
    </div>
  ));
};

// ── 화면 ──
interface Sec {
  unitId: string;
  part: PartId;
  mcq?: Mcq[];
  short?: WrittenQuestion[];
  blanks?: string[];
  ckAns?: string[];
}

export const PrintPage = ({ query }: { query: string }) => {
  const P = new URLSearchParams(query);
  const allUnits = CURRENT_EXAM.teachers.map((t) => t.unitId);
  const units = (P.get('u') ?? allUnits.join(',')).split(',').filter((u) => allUnits.includes(u));
  const parts = (P.get('p') ?? 'qz,fm,hwp,sn').split(',').filter((p): p is PartId => p in NAME);
  const withAns = P.get('ans') !== '0';
  const blank = P.get('q') === '1';
  const cols = P.get('cols') === '1' ? 'one' : '';

  useEffect(() => {
    document.body.classList.add('print-mode');
    if (!document.getElementById('pr-fonts')) {
      const l = document.createElement('link');
      l.id = 'pr-fonts';
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&family=Noto+Serif+KR:wght@400;600&display=swap';
      document.head.appendChild(l);
    }
    return () => document.body.classList.remove('print-mode');
  }, []);

  const scope = units.length === allUnits.length ? '전체 단원' : units.map((u) => `${unitInfo(u).no} ${unitInfo(u).title}`).join(', ');
  const partNames = parts.map((p) => (p === 'notes' ? (blank ? '학습지 빈칸 문제지' : '학습지 정리본') : NAME[p])).join(' · ');

  useEffect(() => {
    document.title = `통합사회2_${units.length === allUnits.length ? '전체' : units.map((u) => unitInfo(u).no).join('_')}_${partNames.replace(/\s|·/g, '')}`;
    if (P.get('auto') === '1') document.fonts.ready.then(() => setTimeout(() => window.print(), 600));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { main, secs } = useMemo(() => {
    const secs: Sec[] = [];
    const main: ReactNode[] = [];
    for (const u of units) {
      const ui = unitInfo(u);
      const head = (label: string, small: string) => (
        <div className="sec-h" key={`${u}-${label}`}>
          <span>{ui.no} {ui.title} · {label}</span>
          <small>{ui.teacher} · {small}</small>
        </div>
      );
      for (const p of parts) {
        if (p === 'notes') {
          const sheets = findUnit(u)?.unit.worksheets ?? [];
          if (!sheets.length) continue;
          const bk: string[] = [];
          const html = notesHtml(sheets, blank, bk);
          main.push(head(blank ? '학습지 빈칸 채우기' : '학습지 정리', blank ? `빈칸 ${bk.length}개 · 정답은 뒤` : '붉은 글씨 = 빈칸 정답 · ✎ = 필기'), <div key={`${u}-n`}>{html}</div>);
          if (blank) secs.push({ unitId: u, part: p, blanks: bk });
        } else if (p === 'ck') {
          const pages = CONCEPT_CHECKS[u] ?? [];
          if (!pages.length) continue;
          const ans: string[] = [];
          const html = ckHtml(pages, ans);
          main.push(head('개념 확인', `${ans.length}문항`), <div key={`${u}-ck`}>{html}</div>);
          secs.push({ unitId: u, part: p, ckAns: ans });
        } else if (p === 'short') {
          const L = TEACHER_BANKS.find((b) => b.unitId === u)?.short ?? [];
          if (!L.length) continue;
          main.push(
            head('단답형', `${L.length}문항`),
            ...L.map((q, i) => (
              <div key={`${u}-s${i}`} className="q">
                <div className="stem"><span className="n">{i + 1}.</span>{q.q}</div>
                <div className="wr" />
              </div>
            )),
          );
          secs.push({ unitId: u, part: p, short: L });
        } else {
          const L = mcqList(u, p);
          if (!L.length) continue;
          main.push(head(NAME[p], `${L.length}문항`));
          let sub = '';
          L.forEach((m, i) => {
            if (m.sub && m.sub !== sub) {
              sub = m.sub;
              main.push(<div key={`${u}-${p}-h${i}`} className="sub-h">{sub}</div>);
            }
            main.push(<McqItem key={`${u}-${p}-${i}`} m={m} n={i + 1} />);
          });
          secs.push({ unitId: u, part: p, mcq: L });
        }
      }
    }
    return { main, secs };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const ymd = (() => {
    const d = new Date();
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  })();

  return (
    <div className="pr">
      <div className="bar">
        <a className="sec" href="#/">← 돌아가기</a>
        <button className="pri" onClick={() => window.print()}>PDF로 저장 / 인쇄</button>
        <span>인쇄 창에서 대상(프린터)을 <b>「PDF로 저장」</b>으로 고르세요. 용지 A4 · 여백 기본값 · 배경 그래픽 켜기</span>
      </div>
      <div className="sheet">
        <div className="doc-title">
          <div>
            <h1>통합사회2 시험 대비 — {scope}</h1>
            <div className="namebox">{partNames}</div>
          </div>
          <div className="meta">2학기 중간고사 · {CURRENT_EXAM.format}<br />___반 ___번 이름 __________</div>
        </div>
        <div className={`cols ${cols}`}>{main.length ? main : <p>선택한 내용이 없습니다.</p>}</div>

        {withAns && secs.length > 0 && (
          <>
            <div className="newpage" />
            <div className="doc-title">
              <div>
                <h1>정답과 해설</h1>
                <div className="namebox">{scope} · {partNames}</div>
              </div>
              <div className="meta">{ymd}</div>
            </div>
            <div className={`cols ${cols}`}>
              {secs.map((s, si) => {
                const ui = unitInfo(s.unitId);
                const label = s.part === 'notes' ? '학습지 빈칸 정답' : NAME[s.part];
                const n = s.mcq?.length ?? s.short?.length ?? s.blanks?.length ?? s.ckAns?.length ?? 0;
                return (
                  <div key={si}>
                    <div className="sec-h ans"><span>{ui.no} {ui.title} · {label}</span><small>{n}개</small></div>
                    {s.blanks && <div className="bkans">{s.blanks.map((t, i) => <div key={i}><i>{i + 1}</i>{t}</div>)}</div>}
                    {s.ckAns && <div className="bkans">{s.ckAns.map((t, i) => <div key={i}><i>{i + 1}</i>{t}</div>)}</div>}
                    {s.short && <div className="bkans one">{s.short.map((q, i) => <div key={i}><i>{i + 1}</i>{q.answer}</div>)}</div>}
                    {s.mcq && (
                      <>
                        <div className="akey">{s.mcq.map((q, i) => <div key={i}><span>{i + 1}</span><b>{MARK[q.answer]}</b></div>)}</div>
                        {s.mcq.map((q, i) => (
                          <div key={i} className="exp"><span className="n">{i + 1}.</span> <span className="a">{MARK[q.answer]}</span>{stripAns(q.explain)}</div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
