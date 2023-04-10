export function createArray2DEmpty<T>(n: int): T[][] {
  return Array(n)
    .fill(undefined)
    .map(_ => <T[]>[]);
}

export function createArray2DFilled<T>(n: int, m: int, x: T): T[][] {
  return Array(n)
    .fill(undefined)
    .map(_ => Array(m).fill(x));
}
