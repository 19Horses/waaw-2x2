import { describe, expect, test } from 'vitest';
import {
  CURRENTLY_PLAYING_REFETCH_INTERVAL_MS,
  CURRENTLY_PLAYING_QUERY,
} from './useGetCurrentlyPlaying';

describe('currently playing query', () => {
  test('polls Sanity every 10 seconds', () => {
    expect(CURRENTLY_PLAYING_REFETCH_INTERVAL_MS).toBe(10_000);
  });

  test('expands the referenced set and its DJs', () => {
    expect(CURRENTLY_PLAYING_QUERY).toContain(
      "*[_type == 'currentlyPlaying' && _id == 'currentlyPlaying'][0]"
    );
    expect(CURRENTLY_PLAYING_QUERY).toContain('set->');
    expect(CURRENTLY_PLAYING_QUERY).toContain('"image": @->image.asset->url');
  });
});
