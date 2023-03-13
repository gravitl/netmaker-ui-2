import { AxiosError } from 'axios';

export function extractErrorMsg(err: AxiosError): string {
  return (err.response?.data as any)?.Message || err.message;
}

export function download(filename: string, data: string) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
