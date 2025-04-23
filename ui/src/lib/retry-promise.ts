import { delay } from './delay';

export type RetryConfig = {
  retries: number;
  delay: number;
};
const DEFAULT_CONFIG: RetryConfig = {
  retries: 3,
  delay: 500,
};
export async function retryPromise<T>(
  fn: () => Promise<T>,
  localConfig?: Partial<RetryConfig>,
): Promise<T> {
  let retries = 0;
  const maxRetries = localConfig?.retries ?? DEFAULT_CONFIG.retries;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries == maxRetries) {
        throw error;
      }
      await delay(localConfig?.delay ?? DEFAULT_CONFIG.delay);
    }
  }
  throw new Error('unreachable "retryPromise" branch');
}
