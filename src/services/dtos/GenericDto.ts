export interface GenericResponseDto<T> {
  Code: number;
  Message: string;
  Response: T;
}
