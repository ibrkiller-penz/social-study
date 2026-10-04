import type { Question, WrittenQuestion } from '../../types';
import { suneung_moon, short_moon } from './moon';
import { suneung_lee, short_lee } from './lee';
import { suneung_yoon, short_yoon } from './yoon';
import { suneung_jang, short_jang } from './jang';
import { hwp_moon } from './hwp_moon';
import { hwp_lee } from './hwp_lee';
import { hwp_jang } from './hwp_jang';
import { moon_suneung_v2 } from './moon_suneung_v2';
import { lee_suneung_v2 } from './lee_suneung_v2';
import { yoon_suneung_v2 } from './yoon_suneung_v2';
import { jang_suneung_v2 } from './jang_suneung_v2';

export interface TeacherBank {
  teacherId: string;
  teacher: string;
  unitId: string;
  unitLabel: string;
  unitTitle: string;
  suneung: Question[];  // 학습지 기반 자체 생성 수능식 (자료+문제+5지선다)
  hwp: Question[];      // 미래엔 출제대비 문제은행 원본
  short: WrittenQuestion[];
}

// 수능식(제시문 포함) v2 + 기본형(개념 확인)을 함께 제공
export const TEACHER_BANKS: TeacherBank[] = [
  { teacherId: 'moon', teacher: '문ㅈㅇ', unitId: 'is2-1', unitLabel: 'Ⅰ단원', unitTitle: '인권보장과 헌법', suneung: [...moon_suneung_v2, ...suneung_moon], hwp: hwp_moon, short: short_moon },
  { teacherId: 'lee', teacher: '이ㅈㅇ', unitId: 'is2-2', unitLabel: 'Ⅱ단원', unitTitle: '사회정의와 불평등', suneung: [...lee_suneung_v2, ...suneung_lee], hwp: hwp_lee, short: short_lee },
  { teacherId: 'yoon', teacher: '윤ㄱㅅ', unitId: 'is2-3', unitLabel: 'Ⅲ단원', unitTitle: '시장경제와 지속가능발전', suneung: [...yoon_suneung_v2, ...suneung_yoon], hwp: [], short: short_yoon },
  { teacherId: 'jang', teacher: '장ㅈㅅ', unitId: 'is2-5', unitLabel: 'Ⅴ단원', unitTitle: '미래와 지속가능한 삶', suneung: [...jang_suneung_v2, ...suneung_jang], hwp: hwp_jang, short: short_jang },
];

export const findBank = (teacherId: string) => TEACHER_BANKS.find((b) => b.teacherId === teacherId);
