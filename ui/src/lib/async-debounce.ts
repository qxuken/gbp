export class AsyncDebounce<T, R> {
  static readonly DEFAULT_DELAY = 750;

  timeout: NodeJS.Timeout | null = null;
  current: {
    resolve: (v: Promise<R>) => void;
    reject: (v: Promise<R>) => void;
    promise: Promise<R>;
  } | null = null;

  constructor(
    private readonly task: (v: T) => Promise<R>,
    public readonly delay: number = AsyncDebounce.DEFAULT_DELAY,
  ) {}

  run(v: T): Promise<R> {
    if (!this.current) {
      this.current = Promise.withResolvers();
    }
    this.execTimeout(v);
    return this.current.promise;
  }

  cancel() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.current = null;
  }

  private execTimeout(v: T) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      if (!this.current) {
        console.warn(
          'AsyncDebounce execution was called, but current value is null',
        );
        return;
      }
      this.current.resolve(this.task(v));
      this.current = null;
      this.timeout = null;
    }, this.delay);
  }
}
