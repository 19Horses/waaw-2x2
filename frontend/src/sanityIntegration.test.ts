import { describe, expect, test } from 'vitest';
import { getApiUrl } from './sanityIntegration';

describe('getApiUrl', () => {
  test('encodes GROQ operators so they do not become URL parameters', () => {
    const url = new URL(
      getApiUrl(
        "*[_type == 'currentlyPlaying' && _id == 'currentlyPlaying'][0]"
      )
    );

    expect(url.searchParams.get('_id')).toBeNull();
    expect(url.searchParams.get('query')).toContain(
      "&& _id == 'currentlyPlaying'"
    );
  });
});
