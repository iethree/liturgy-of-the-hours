declare module 'daily-office-lectionary' {
  export interface LectionaryQuery {
    day?: string;
    year?: string;
    week?: string;
    title?: string;
  }

  export interface LectionaryRecord {
    year?: string;
    week?: string;
    shortWeek?: string;
    day?: string;
    season?: string;
    title?: string;
    /** Lessons can be nested arrays or flat string arrays depending on source */
    lessons: ReadonlyArray<string> | ReadonlyArray<ReadonlyArray<string>> | Record<string, unknown>;
    psalms: {
      morning?: ReadonlyArray<string>;
      evening?: ReadonlyArray<string>;
    };
  }

  export function get(query: LectionaryQuery): Promise<LectionaryRecord>;
  export function getMany(query: LectionaryQuery): Promise<LectionaryRecord[]>;

  const _default: { get: typeof get; getMany: typeof getMany };
  export default _default;
}
