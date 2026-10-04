// 미리 만든 PDF 생성: `npm run build && npx vite preview --port 4175` 실행 중에
// node scripts/make-pdfs.mjs  → public/pdf/{단원}-{questions|sheet|notes}.pdf
// (playwright 필요: PLAYWRIGHT 경로를 PW 환경변수로 지정 가능)
const pw = await import(process.env.PW ?? 'playwright');
const { chromium } = pw.default ?? pw;
const BASE = process.env.BASE ?? 'http://localhost:4175/';
const UNITS = ['is2-1', 'is2-2', 'is2-3', 'is2-5'];
const KINDS = {
  questions: 'p=qz,fm,hwp,sn,short&ans=1&q=1&cols=2',
  sheet: 'p=notes,ck&ans=1&q=1&cols=2',
  notes: 'p=notes&ans=0&q=0&cols=2',
};
const b = await chromium.launch();
const p = await b.newPage();
for (const u of UNITS)
  for (const [k, q] of Object.entries(KINDS)) {
    await p.goto(`${BASE}#/print?u=${u}&${q}`);
    await p.waitForLoadState('networkidle');
    await p.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))));
    });
    await p.pdf({ path: `public/pdf/${u}-${k}.pdf`, preferCSSPageSize: true, printBackground: true });
    console.log('made', u, k);
  }
await b.close();
