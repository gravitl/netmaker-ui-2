export type MutableRequired<T> = { -readonly [P in keyof T]-?: T[P] };
