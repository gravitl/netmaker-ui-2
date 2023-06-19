import { extractErrorMsg } from '@/utils/ServiceUtils';
import { AxiosError } from 'axios';

describe('ServiceUtils', () => {
  it('is able to deduce error messages', () => {
    const errMsg = 'test error';
    const dummyErr = new Error(errMsg);
    const axiosErr = new AxiosError(errMsg, '500');

    expect(extractErrorMsg(dummyErr)).toEqual(errMsg);
    expect(extractErrorMsg(axiosErr)).toEqual(errMsg);
  });
});
