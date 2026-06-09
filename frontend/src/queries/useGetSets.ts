import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getApiUrl } from '../sanityIntegration';
import axios from 'axios';

export type SetDJType = {
  _key: string;
  _id: string;
  name: string;
  image: string;
};

export type SetType = {
  _id: string;
  djs: SetDJType[];
};

export const SETS_QUERY = `
  *[_type == 'set'] | order(_createdAt asc){
    _id,
    djs[]{
      _key,
      "_id": @->_id,
      "name": @->name,
      "image": @->image.asset->url
    }
  }
`;

export const getSets = async (): Promise<{ result: SetType[] }> => {
  const response = await axios.get(getApiUrl(SETS_QUERY));
  return response.data;
};

export const useGetSets = (): UseQueryResult<SetType[], Error> => {
  return useQuery<{ result: SetType[] }, Error, SetType[]>({
    queryKey: ['sets'],
    queryFn: getSets,
    select: (res) => res.result,
  });
};
