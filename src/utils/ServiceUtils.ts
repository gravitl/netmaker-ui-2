import { AxiosError } from 'axios';

export function extractErrorMsg(err: AxiosError): string {
  return (err.response?.data as any)?.Message || err.message;
}
