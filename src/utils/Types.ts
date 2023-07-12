export type MutableRequired<T> = { -readonly [P in keyof T]-?: T[P] };

export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;
