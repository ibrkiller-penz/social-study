export interface Term {
  term: string;
  def: string;
}

export interface Question {
  q: string;
  /** OX 문제는 ['O', 'X'] */
  choices: string[];
  /** choices 의 정답 인덱스 */
  answer: number;
  explain: string;
}

export interface WrittenQuestion {
  q: string;
  answer: string; // 모범 답안
  keywords: string[]; // 채점 핵심어
}



/** HWP 원본 레이아웃을 살린 문항 구조 (발문 · 제시문 박스 · <보기> · 표 · 그림) */
export type QBlock =
  | { t: 'text'; text: string }
  | { t: 'box'; lines: string[]; imgs?: string[]; children?: QBlock[] }
  | { t: 'table'; rows: string[][] }
  | { t: 'imgs'; srcs: string[] }
  | { t: 'bogi'; items: string[] };

export interface QStruct {
  instruction?: string;
  stem: string;
  blocks: QBlock[];
  choices: string[];
}

export interface FormativeQuestion {
  q: string;
  choices: string[];
  answer: number;
  explain: string;
}

export interface FormativeSection {
  title: string;
  questions: FormativeQuestion[];
}

export interface CheckPage {
  title: string;
  checks: CheckGroup[];
}

export type CheckProblem =
  | { kind: 'ox'; q: string; answer: 'O' | 'X'; explain?: string }
  | { kind: 'choose'; q: string; options: string[]; answer: number; explain?: string }
  | { kind: 'pick'; q: string; parts: string[]; answer: number; explain?: string }
  | { kind: 'match'; left: string; right: string };

export interface CheckGroup {
  title: string; // 예: '설명이 옳으면 O표, 틀리면 X표를 하시오.'
  problems: CheckProblem[];
}

export interface Worksheet {
  title: string; // 예: '학습지 1쪽'
  sections: { heading: string; lines: string[]; annotations?: string[] }[]; // annotations: 아들 손 필기(붉은색 표시)
  /** 개념 확인 문제형 학습지일 때 사용. 있으면 sections 대신 이걸 렌더링. */
  kind?: 'check';
  checks?: CheckGroup[];
}

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  summary: { heading: string; points: string[] }[];
  terms: Term[];
  quiz: Question[];
  /** 모의고사용 5지선다 문제 */
  exam?: Question[];
  /** 모의고사용 서답형 문제 */
  written?: WrittenQuestion[];
  worksheets?: Worksheet[];
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  units: Unit[];
}

export interface UnitProgress {
  bestScore: number; // 0~100
  attempts: number;
  lastStudied: number; // epoch ms
}

export interface WrongNote {
  key: string; // `${unitId}:${index}`
  unitId: string;
  index: number;
  count: number;
  lastWrong: number;
}


export interface AttemptRecord {
  r1?: 'O' | 'X';
  r2?: 'O' | 'X';
  lastAt?: number;
}
export interface StudyState {
  progress: Record<string, UnitProgress>;
  wrong: Record<string, WrongNote>;
  knownTerms: Record<string, true>; // `${unitId}:${term}`
  attempts?: Record<string, AttemptRecord>; // `${unitId}:${type}:${qId}`
}
