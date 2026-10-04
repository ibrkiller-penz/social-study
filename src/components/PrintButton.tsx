import { Printer } from 'lucide-react';

// 학습지·문제은행 인쇄 버튼. onBefore/onAfter 로 인쇄 전 상태(정답 숨김 등) 조작.
interface Props {
  label?: string;
  onBefore?: () => void;
  onAfter?: () => void;
}

export const PrintButton = ({ label = '인쇄하기', onBefore, onAfter }: Props) => (
  <button
    onClick={() => {
      onBefore?.();
      setTimeout(() => {
        window.print();
        setTimeout(() => onAfter?.(), 50);
      }, 30);
    }}
    className="no-print inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900"
  >
    <Printer className="h-4 w-4" />
    {label}
  </button>
);
