import type { Question, WrittenQuestion } from '../types';
import { CURRENT_EXAM } from './exam';
import { findUnit } from './index';
import { questionIndex } from './questionIndex';

// 모의고사에 쓸 5지선다 문제 — 실제 시험 형식(선택형 20 · 서답형 4)에 맞춘 추가 문제
// 각 선생님별 단원(문ㅈㅇⅠ, 이ㅈㅇⅡ, 윤ㄱㅅⅢ, 장ㅈㅅⅤ)에서 뽑아 20문항을 구성한다.
const extra: Record<string, Question[]> = {
  'is2-1': [
    {
      q: '다음 중 인권의 특징에 해당하지 않는 것은?',
      choices: ['천부성', '보편성', '항구성', '가변성', '불가침성'],
      answer: 3,
      explain: '인권은 시대·상황에 따라 마음대로 바뀌지 않으며(항구성), 가변성은 특징이 아니다.',
    },
    {
      q: '다음 사건을 시간 순서대로 바르게 나열한 것은?\nㄱ. 대헌장   ㄴ. 미국 독립 선언   ㄷ. 프랑스 인권 선언   ㄹ. 바이마르 헌법',
      choices: ['ㄱ-ㄴ-ㄷ-ㄹ', 'ㄱ-ㄷ-ㄴ-ㄹ', 'ㄴ-ㄱ-ㄷ-ㄹ', 'ㄴ-ㄷ-ㄱ-ㄹ', 'ㄹ-ㄱ-ㄴ-ㄷ'],
      answer: 0,
      explain: '대헌장(1215) → 미국 독립 선언(1776) → 프랑스 인권 선언(1789) → 바이마르 헌법(1919).',
    },
    {
      q: '"근로자가 사용자와 대등한 지위에서 근로 조건을 협의할 수 있도록 국가는 노동조합 결성을 보장한다." 이와 관련이 깊은 기본권은?',
      choices: ['자유권', '평등권', '사회권', '참정권', '청구권'],
      answer: 2,
      explain: '근로 3권 보장은 인간다운 생활을 위해 국가가 개입하는 사회권의 예이다.',
    },
    {
      q: '헌법 소원 심판에 관한 설명으로 옳은 것은?',
      choices: [
        '국회가 만든 모든 법률을 헌법재판소가 자동으로 심사한다.',
        '공권력에 의해 기본권이 침해된 국민이 청구할 수 있다.',
        '국가 기관 사이의 권한 다툼을 해결하는 심판이다.',
        '대통령을 파면하기 위한 심판이다.',
        '판사가 임의로 법률을 무효화하는 심판이다.',
      ],
      answer: 1,
      explain: '헌법 소원은 국민이 직접 기본권 침해 구제를 청구하는 제도이다.',
    },
  ],
  'is2-2': [
    {
      q: '다음 상황에 적용된 분배 기준은?\n"신입 사원 채용에서 전년도 실적이 가장 높았던 지원자를 우선 채용한다."',
      choices: ['필요', '업적', '능력', '절대적 평등', '기회 균등'],
      answer: 1,
      explain: '과거 성과(실적)를 기준으로 분배하므로 업적 기준이다.',
    },
    {
      q: '롤스와 노직의 정의관을 비교한 설명으로 옳은 것은?',
      choices: [
        '롤스는 최소 국가만이 정의롭다고 본다.',
        '노직은 차등의 원칙을 통해 최소 수혜자를 배려한다.',
        '롤스는 사회적 약자를 배려한 재분배를 정당화한다.',
        '노직은 공동체 전통을 개인 권리보다 우선한다.',
        '두 사람 모두 절대적 평등을 이상적 분배로 본다.',
      ],
      answer: 2,
      explain: '롤스는 차등의 원칙으로 재분배를 정당화하고, 노직은 소유권을 강조한다.',
    },
    {
      q: '공동체주의적 정의관과 가장 거리가 먼 것은?',
      choices: ['공동선', '연대 의식', '무연고적 자아', '전통과 미덕', '공동체의 가치'],
      answer: 2,
      explain: '무연고적 자아는 자유주의(롤스)의 인간관에 가깝다.',
    },
    {
      q: '다음 정책의 공통점으로 가장 적절한 것은?\n장애인 의무 고용제, 농어촌 특별 전형, 여성 임원 할당제',
      choices: [
        '시장 경쟁 촉진',
        '적극적 우대 조치',
        '자원 민족주의 강화',
        '최소 국가 원칙 실현',
        '문화 사대주의 극복',
      ],
      answer: 1,
      explain: '차별받아 온 집단에 혜택을 주어 실질적 평등을 실현하는 적극적 우대 조치이다.',
    },
  ],
  'is2-3': [
    {
      q: '다음 자본주의의 발전 단계를 순서대로 바르게 나열한 것은?\nㄱ. 산업 자본주의   ㄴ. 수정 자본주의   ㄷ. 상업 자본주의   ㄹ. 신자유주의',
      choices: ['ㄷ-ㄱ-ㄴ-ㄹ', 'ㄷ-ㄴ-ㄱ-ㄹ', 'ㄱ-ㄷ-ㄴ-ㄹ', 'ㄴ-ㄱ-ㄹ-ㄷ', 'ㄷ-ㄱ-ㄹ-ㄴ'],
      answer: 0,
      explain: '상업 → 산업 → 수정(대공황) → 신자유주의(1970년대) 순.',
    },
    {
      q: '다음 사례에 해당하는 시장 실패 유형은?\n"주민들이 이용하는 등대는 시장에서 충분히 공급되지 않는다."',
      choices: ['독과점', '외부 경제', '외부 불경제', '공공재 부족', '정보 비대칭'],
      answer: 3,
      explain: '비배제성·비경합성을 가진 등대는 대표적 공공재이다.',
    },
    {
      q: '자산 관리 원칙에 대한 설명으로 옳지 않은 것은?',
      choices: [
        '수익성이 높으면 대체로 위험도 높다.',
        '유동성은 필요할 때 손실 없이 현금화할 수 있는 정도이다.',
        '분산 투자는 위험을 낮추는 방법 중 하나이다.',
        '예금은 주식보다 안전성이 높다.',
        '주식은 예금보다 유동성이 항상 높다.',
      ],
      answer: 4,
      explain: '주식은 가격 하락 시 손실 없이 현금화가 어려워 유동성이 항상 높다고 볼 수 없다.',
    },
    {
      q: '갑국은 자동차, 을국은 옷의 생산에 비교 우위가 있다. 두 나라가 특화·교역할 때 나타나는 현상으로 옳은 것은?',
      choices: [
        '두 나라 모두 이익을 볼 수 없다.',
        '두 나라 모두 소비 가능한 재화의 양이 증가한다.',
        '한 나라가 양쪽 재화에 절대 우위를 가지면 무역 이익이 없다.',
        '기회비용이 큰 재화에 특화해야 이익이 커진다.',
        '무역 후에는 국내 산업이 반드시 소멸한다.',
      ],
      answer: 1,
      explain: '비교 우위에 따라 특화·교역하면 두 나라 모두 소비 가능 영역이 커진다.',
    },
  ],
  'is2-5': [
    {
      q: '개발 도상국의 인구 문제로 가장 적절한 것은?',
      choices: [
        '노년 부양비 급증',
        '인구 감소로 인한 지역 소멸',
        '높은 출생률로 인한 인구 급증',
        '노동력 부족으로 인한 이민자 급감',
        '초고령 사회 진입',
      ],
      answer: 2,
      explain: '개발 도상국은 출생률이 높아 인구 부양력 부족 문제를 겪는다.',
    },
    {
      q: '신재생 에너지에 대한 설명으로 옳지 않은 것은?',
      choices: [
        '태양광은 재생 에너지에 해당한다.',
        '풍력·수력은 자연 조건의 영향을 받는다.',
        '초기 설치비가 크게 든다.',
        '이산화 탄소 배출이 화석 연료보다 적다.',
        '고갈 위험이 화석 연료보다 크다.',
      ],
      answer: 4,
      explain: '재생 에너지는 고갈 위험이 낮다는 것이 대표적 장점이다.',
    },
    {
      q: '유엔의 지속가능발전목표(SDGs)에 대한 설명으로 옳은 것은?',
      choices: [
        '경제 성장 하나만을 목표로 한다.',
        '2015년에 채택된 17개 목표이다.',
        '선진국만 참여하는 협약이다.',
        '환경 보전 목표는 포함되지 않는다.',
        '실행 기간은 2020년으로 종료되었다.',
      ],
      answer: 1,
      explain: 'SDGs는 2015년 UN이 채택한 17개 목표, 169개 세부 목표로 2030년까지의 계획이다.',
    },
    {
      q: '세계 시민 의식의 사례로 가장 거리가 먼 것은?',
      choices: [
        '공정 무역 제품 구매',
        '기후 변화 대응 캠페인 참여',
        '국제 인권 단체 후원',
        '자국의 이익만 강조하는 자원 민족주의 지지',
        '난민 지원 봉사 활동',
      ],
      answer: 3,
      explain: '세계 시민 의식은 지구촌의 공동 문제를 함께 해결하려는 태도이므로 자국 이익만 앞세우는 태도와 대비된다.',
    },
  ],
};

// 서답형 4문항 (선생님별 1문항씩)
const writtenBank: WrittenQuestion[] = [
  {
    q: '(문ㅈㅇ 선생님 범위) 헌법 제37조 제2항에 따라 기본권을 제한할 수 있는 세 가지 사유를 쓰시오.',
    answer: '국가 안전 보장, 질서 유지, 공공복리',
    keywords: ['국가', '안전', '질서', '공공복리'],
  },
  {
    q: '(이ㅈㅇ 선생님 범위) 롤스가 제시한 정의의 원칙 중 "사회적·경제적 불평등은 최소 수혜자에게 최대 이익이 되도록 조정되어야 한다."는 원칙을 무엇이라 하는지 쓰시오.',
    answer: '차등의 원칙',
    keywords: ['차등'],
  },
  {
    q: '(윤ㄱㅅ 선생님 범위) 자산 관리의 3원칙을 모두 쓰시오.',
    answer: '안전성, 수익성, 유동성',
    keywords: ['안전성', '수익성', '유동성'],
  },
  {
    q: '(장ㅈㅅ 선생님 범위) 65세 이상 인구 비율이 20% 이상인 사회를 무엇이라 하는지 쓰시오.',
    answer: '초고령 사회',
    keywords: ['초고령'],
  },
];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// 시험 형식: 선택형 20문항 + 서답형 4문항 (선생님별 5문항 + 서답형 1문항)
export interface MockExam {
  choice: { key?: string; source?: string; unitId: string; unitTitle: string; teacher: string; question: Question }[];
  written: WrittenQuestion[];
}

export const buildMockExam = (): MockExam => {
  const choice: MockExam['choice'] = [];
  const all = [...questionIndex().values()];
  CURRENT_EXAM.teachers.forEach((t) => {
    const unit = findUnit(t.unitId);
    if (!unit) return;
    const mine = all.filter((q) => q.unitId === t.unitId);
    const fm = mine.filter((q) => q.key.includes(':fm:'));
    const hwp = mine.filter((q) => q.key.includes(':bank:hwp:'));
    const sn = mine.filter((q) => /:bank:sn:(\d+)$/.test(q.key) && Number(q.key.split(':').pop()) < 20); // 수능식 v2
    const qz = mine.filter((q) => q.key.includes(':qz:'));
    // 선생님별 5문항: 형성평가 2 · 문제은행 2(미래엔 원본 우선, 없으면 수능식) · 학습지 퀴즈 1
    const bank = hwp.length ? [...shuffle(hwp).slice(0, 1), ...shuffle(sn).slice(0, 1)] : shuffle(sn).slice(0, 2);
    const picked = [...shuffle(fm).slice(0, 2), ...bank, ...shuffle(qz).slice(0, 1)];
    // 부족하면 기존 퀴즈로 채움
    const fallback = shuffle([...unit.unit.quiz, ...(extra[t.unitId] ?? [])]);
    picked.forEach((q) =>
      choice.push({ key: q.key, source: q.source, unitId: t.unitId, unitTitle: unit.unit.title, teacher: t.teacher, question: { q: q.q, choices: q.choices, answer: q.answer, explain: q.explain ?? '' } }),
    );
    for (let k = picked.length; k < 5 && fallback.length; k++) choice.push({ unitId: t.unitId, unitTitle: unit.unit.title, teacher: t.teacher, question: fallback.pop()! });
  });
  return { choice: shuffle(choice), written: writtenBank };
};
