export type FilesMatcher = {
  /** At least one changed file must match one of these globs */
  any?: string[];
  /** Every glob must match at least one changed file */
  all?: string[];
  /** Every changed file must match at least one of these globs (only these paths were edited) */
  only?: string[];
  count?: {
    gte?: number;
    lte?: number;
  };
};
