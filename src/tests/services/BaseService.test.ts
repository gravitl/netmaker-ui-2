import { useStore } from '@/store/store';

describe('BaseService', () => {
  it('should correctly setup tenant data for standalone', async () => {
    const mockBaseUrl = 'http://localhost:9999';
    const expectedRes = `${mockBaseUrl}/api`;

    import.meta.env.VITE_IS_SAAS_BUILD = 'false';
    import.meta.env.VITE_BASE_URL = mockBaseUrl;

    const { setupTenantConfig, baseService, isSaasBuild } = await import('@/services/BaseService');

    setupTenantConfig();

    expect(isSaasBuild).toEqual(false);
    expect(baseService.defaults.baseURL).toEqual(expectedRes);
    expect(useStore.getState().baseUrl).toEqual(expectedRes);
  });

  // TODO: test SaaS config with integration tests
});
