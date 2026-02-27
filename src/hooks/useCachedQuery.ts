import { useQuery, UseQueryOptions } from "@tanstack/react-query";

/**
 * A wrapper around useQuery that caches results in localStorage
 * and falls back to cached data when the network request fails.
 */
export function useCachedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>
) {
  const cacheKey = `cached_query_${queryKey.join('_')}`;

  return useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      try {
        const data = await queryFn();
        // Save to localStorage on success
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
          console.warn('Failed to cache data to localStorage:', e);
        }
        return data;
      } catch (error) {
        // On failure, try to return cached data
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          console.info(`Using cached data for ${queryKey.join('/')}`);
          return JSON.parse(cached) as T;
        }
        throw error;
      }
    },
    // Keep stale data visible while refetching
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    ...options,
  });
}
