export const shallowObfuscate = <T>(
  data: T,
  obfuscatedKeys: (keyof T)[],
): Partial<T> =>
  obfuscatedKeys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: "***",
    }),
    data,
  );
