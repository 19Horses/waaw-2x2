import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '../sanityIntegration';
import axios from 'axios';

export type DJType = {
  _id: string;
  name: string;
  image: string;
};

export const DJS_QUERY = `
  *[_type == 'dj']{
    _id,
    name,
    "image": image.asset->url
  }
`;

export const getDJs = async (): Promise<{ result: DJType[] }> => {
  const response = await axios.get(getApiUrl(DJS_QUERY));
  return response.data;
};

export const useGetDJs = () => {
  return useQuery({
    queryKey: ['djs'],
    queryFn: getDJs,
    select: (res) => res.result,
  });
};
