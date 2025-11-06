export function tryRequire<T = any>(moduleName: string): T | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(moduleName) as T;
  } catch (err: any) {
    if (
      err &&
      (err.code === 'MODULE_NOT_FOUND' || err.code === 'ERR_MODULE_NOT_FOUND')
    ) {
      return null;
    }
    throw err;
  }
}
