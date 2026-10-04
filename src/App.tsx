import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { UnitPage } from './pages/UnitPage';
import { WrongPage, countWrong } from './pages/WrongPage';
import { MockExamPage } from './pages/MockExamPage';
import { useRoute } from './router';
import { useStudyStore } from './store';
import { PrintPage } from './print/PrintPage';

export const App = () => {
  const route = useRoute();
  const store = useStudyStore();
  const wrongCount = countWrong(store.state.attempts);

  if (route.page === 'print') return <PrintPage key={route.query} query={route.query} />;

  return (
    <div className="min-h-screen">
      <Header user={store.user} wrongCount={wrongCount} unitId={route.page === 'unit' ? route.unitId : undefined} />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
        {route.page === 'home' && <HomePage store={store} />}
        {route.page === 'unit' && <UnitPage key={route.unitId} unitId={route.unitId} teacherId={route.teacherId} store={store} />}
        {route.page === 'wrong' && <WrongPage store={store} />}
        {route.page === 'mock' && <MockExamPage store={store} />}
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        사회 학습실 · 통합사회 개념 정리 · 퀴즈 · 오답노트
      </footer>
    </div>
  );
};
