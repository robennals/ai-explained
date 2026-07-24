export function keyValueWork(promptLen: number, generated: number, cache: boolean): number {
  if (cache) return promptLen + generated;
  let work = 0;
  for (let t = 1; t <= generated; t++) work += promptLen + (t - 1);
  return work;
}

export function cacheMemory(promptLen: number, generated: number): number {
  return promptLen + generated;
}
