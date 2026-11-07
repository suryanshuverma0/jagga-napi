/* eslint-disable @typescript-eslint/no-require-imports */
const { GOOGLE_TEST_IDS, isTestOrEmpty, resolveAdIds } =
  require('../ad-ids.js') as typeof import('../ad-ids.js');

const REAL = {
  ADMOB_APP_ID: 'ca-app-pub-1234567890123456~1111111111',
  ADMOB_BANNER_ID: 'ca-app-pub-1234567890123456/2222222222',
  ADMOB_INTERSTITIAL_ID: 'ca-app-pub-1234567890123456/3333333333',
  ADMOB_REWARDED_ID: 'ca-app-pub-1234567890123456/4444444444',
};

describe('release guard for AdMob IDs', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('development and preview builds fall back to Google test IDs', () => {
    const ids = resolveAdIds({});
    expect(ids).toMatchObject({ ...GOOGLE_TEST_IDS, usingTestIds: true });
    expect(resolveAdIds({ EAS_BUILD: 'true', EAS_BUILD_PROFILE: 'preview' }).usingTestIds).toBe(true);
  });

  it('uses real IDs when they are set', () => {
    const ids = resolveAdIds({ ...REAL, EAS_BUILD: 'true', EAS_BUILD_PROFILE: 'production' });
    expect(ids).toEqual({
      appId: REAL.ADMOB_APP_ID,
      banner: REAL.ADMOB_BANNER_ID,
      interstitial: REAL.ADMOB_INTERSTITIAL_ID,
      rewarded: REAL.ADMOB_REWARDED_ID,
      usingTestIds: false,
    });
  });

  it('throws on the EAS worker for a production build with a missing ID', () => {
    const env = { ...REAL, ADMOB_REWARDED_ID: '', EAS_BUILD: 'true', EAS_BUILD_PROFILE: 'production' };
    expect(() => resolveAdIds(env)).toThrow(/ADMOB_REWARDED_ID/);
  });

  it('throws on the EAS worker for a production build with a Google test ID', () => {
    const env = {
      ...REAL,
      ADMOB_BANNER_ID: GOOGLE_TEST_IDS.banner,
      ADMOB_APP_ID: GOOGLE_TEST_IDS.appId,
      EAS_BUILD: 'true',
      EAS_BUILD_PROFILE: 'production',
    };
    expect(() => resolveAdIds(env)).toThrow(/ADMOB_APP_ID, ADMOB_BANNER_ID/);
  });

  it('only warns when eas-cli evaluates the config locally (secrets are not readable there)', () => {
    expect(() => resolveAdIds({ EAS_BUILD_PROFILE: 'production' })).not.toThrow();
    expect(warn).toHaveBeenCalled();
    expect(() => resolveAdIds({ EAS_BUILD_PROFILE: 'production', JAGGA_STRICT_AD_GUARD: '1' })).toThrow();
  });

  it('treats any ID from the Google sample publisher as a test ID', () => {
    expect(isTestOrEmpty('ca-app-pub-3940256099942544/9999999999')).toBe(true);
    expect(isTestOrEmpty('  ')).toBe(true);
    expect(isTestOrEmpty(undefined)).toBe(true);
    expect(isTestOrEmpty(REAL.ADMOB_BANNER_ID)).toBe(false);
  });
});
