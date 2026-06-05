import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getApiUrl } from '../sanityIntegration';
import type { SetType } from './useGetSets';

export type CurrentlyPlayingType = {
  _id: string;
  set: SetType | null;
};

export const CURRENTLY_PLAYING_REFETCH_INTERVAL_MS = 30_000;

export const CURRENTLY_PLAYING_QUERY = `
  *[_type == 'currentlyPlaying' && _id == 'currentlyPlaying'][0]{
    _id,
    set->{
      _id,
      djs[]{
        _key,
        "_id": @->_id,
        "name": @->name,
        "image": @->image.asset->url
      }
    }
  }
`;

export const getCurrentlyPlaying = async (): Promise<{
  result: CurrentlyPlayingType | null;
}> => {
  const response = await axios.get(getApiUrl(CURRENTLY_PLAYING_QUERY));
  return response.data;
};

export const useGetCurrentlyPlaying = () => {
  return useQuery({
    queryKey: ['currentlyPlaying'],
    queryFn: getCurrentlyPlaying,
    refetchInterval: CURRENTLY_PLAYING_REFETCH_INTERVAL_MS,
    select: (res) => res.result,
  });
};
