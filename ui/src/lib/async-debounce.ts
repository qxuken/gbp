export class AsyncDebounce<T, R> {
  timeout: NodeJS.Timeout | null = null;
  current: {
    resolve: (v: Promise<R>) => void;
    reject: (v: Promise<R>) => void;
    promise: Promise<R>;
  } | null = null;

  constructor(
    private readonly task: (v: T) => Promise<R>,
    public delay: number,
  ) {}

  run(v: T): Promise<R> {
    if (!this.current) {
      this.current = Promise.withResolvers();
    }
    this.execTimeout(v);
    return this.current.promise;
  }

  private execTimeout(v: T) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.current?.resolve(this.task(v));
      this.current = null;
      this.timeout = null;
    }, this.delay);
  }
}
