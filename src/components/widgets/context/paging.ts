export function blocksNeeded(tokens: number, blockSize: number): number {
  return Math.ceil(tokens / blockSize);
}

export function pagedWaste(seqLens: number[], blockSize: number): number {
  return seqLens.reduce((w, len) => w + (blocksNeeded(len, blockSize) * blockSize - len), 0);
}

export function contiguousWaste(seqLens: number[], reservedPerSeq: number): number {
  return seqLens.reduce((w, len) => w + (reservedPerSeq - len), 0);
}

export function sharedBlocks(prefixLen: number, seqCount: number, blockSize: number): number {
  return (seqCount - 1) * Math.floor(prefixLen / blockSize);
}
