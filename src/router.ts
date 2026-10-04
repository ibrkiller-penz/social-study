import { useEffect, useState } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'unit'; unitId: string; teacherId?: string }
  | { page: 'wrong' }
  | { page: 'mock' }
  | { page: 'print'; query: string };

const parse = (): Route => {
  const [path, query] = location.hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'unit' && parts[1]) {
    const teacherId = new URLSearchParams(query).get('t') ?? undefined;
    return { page: 'unit', unitId: parts[1], teacherId };
  }
  if (parts[0] === 'wrong') return { page: 'wrong' };
  if (parts[0] === 'mock') return { page: 'mock' };
  if (parts[0] === 'print') return { page: 'print', query: query ?? '' };
  return { page: 'home' };
};

export const useRoute = () => {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
};

export const unitHref = (unitId: string, teacherId?: string) =>
  `#/unit/${unitId}${teacherId ? `?t=${teacherId}` : ''}`;
