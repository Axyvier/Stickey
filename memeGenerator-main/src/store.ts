import { useReducer } from 'react';
import { Doc } from './types';

type S = { past: Doc[]; now: Doc; future: Doc[]; key: string | null };
type A =
  | { t: 'edit'; f: (d: Doc) => Doc; key?: string }
  | { t: 'end' } | { t: 'undo' } | { t: 'redo' };

const initial: Doc = { objs: [], img: null, a: '#232946', b: '#b8c1ec', r: 1 };

function reduce(s: S, a: A): S {
  switch (a.t) {
    case 'edit': {
      const now = a.f(s.now);
      if (now === s.now) return s;
      if (a.key && a.key === s.key) return { ...s, now }; // gabungkan edit beruntun (drag/slider)
      return { past: [...s.past.slice(-49), s.now], now, future: [], key: a.key ?? null };
    }
    case 'end': return { ...s, key: null };
    case 'undo':
      return s.past.length
        ? { past: s.past.slice(0, -1), now: s.past[s.past.length - 1], future: [s.now, ...s.future], key: null }
        : s;
    case 'redo':
      return s.future.length
        ? { past: [...s.past, s.now], now: s.future[0], future: s.future.slice(1), key: null }
        : s;
  }
}

export const useDoc = () =>
  useReducer(reduce, { past: [], now: initial, future: [], key: null } as S);
