export const makeSuggestAmount = (baseNumber: number): number[] => {
  return [
    baseNumber,
    baseNumber !== 0
      ? [baseNumber * 10, baseNumber * 100, baseNumber * 1000, baseNumber * 10000]
      : [50000, 100000, 200000, 500000]
  ].flat();
};