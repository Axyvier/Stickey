export type Obj = {
  id: number; kind: 'text' | 'emoji'; text: string;
  x: number; y: number; size: number; color: string;
  stroke: number; rot: number; op: number;
};
export type Doc = { objs: Obj[]; img: string | null; a: string; b: string; r: number };
