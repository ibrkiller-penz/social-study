import { useState } from 'react';
import { BookMarked, FileDown, Globe2, LogIn, LogOut } from 'lucide-react';
import { PdfDialog } from '../print/PdfDialog';
import { firebaseEnabled, login, logout, type User } from '../firebase';

interface Props {
  user: User | null;
  wrongCount: number;
  unitId?: string;
}

export const Header = ({ user, wrongCount, unitId }: Props) => {
  const [pdf, setPdf] = useState(false);
  return (
  <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
    <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <a href="#/" className="flex items-center gap-2 font-bold text-teal-700">
        <Globe2 className="h-6 w-6" />
        <span className="whitespace-nowrap text-base max-[359px]:hidden sm:text-lg">사회 학습실</span>
      </a>
      <nav className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => setPdf(true)}
          className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-sm font-bold text-white hover:bg-slate-700"
        >
          <FileDown className="h-4 w-4" />
          PDF<span className="hidden sm:inline"> 저장</span>
        </button>
        <a
          href="#/wrong"
          className="flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:px-3"
        >
          <BookMarked className="h-4 w-4" />
          <span className="hidden sm:inline">오답노트</span>
          <span className="sm:hidden">오답</span>
          {wrongCount > 0 && (
            <span className="rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">{wrongCount}</span>
          )}
        </a>
        {firebaseEnabled &&
          (user ? (
            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
              title={user.email ?? ''}
            >
              {user.photoURL && <img src={user.photoURL} alt="" className="h-6 w-6 rounded-full" />}
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          ) : (
            <button
              onClick={() => login().catch(() => alert('로그인에 실패했습니다.'))}
              className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-teal-700 sm:px-3"
              aria-label="로그인"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">로그인</span>
            </button>
          ))}
      </nav>
    </div>
    {pdf && <PdfDialog unitId={unitId} onClose={() => setPdf(false)} />}
  </header>
  );
};
