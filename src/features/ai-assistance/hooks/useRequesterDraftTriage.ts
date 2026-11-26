import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiApi } from '../api/aiApi';
import { aiQueryKeys } from '../api/aiQueries';

interface UseRequesterDraftTriageOptions {
  title?: string;
  description?: string;
  enabled?: boolean;
  debounceMs?: number;
}

export function useRequesterDraftTriage({
  title = '',
  description = '',
  enabled = true,
  debounceMs = 400,
}: UseRequesterDraftTriageOptions) {
  const [debounced, setDebounced] = useState({ title, description });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced({ title, description });
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [title, description, debounceMs]);

  const hasMeaningfulText = debounced.title.trim().length >= 3 || debounced.description.trim().length >= 5;

  return useQuery({
    queryKey: aiQueryKeys.classifyDraft(debounced.title.trim(), debounced.description.trim()),
    queryFn: ({ signal }) =>
      aiApi.classifyDraft({ title: debounced.title.trim(), description: debounced.description.trim() }, signal),
    enabled: enabled && hasMeaningfulText,
    retry: false,
    staleTime: 60_000,
  });
}
