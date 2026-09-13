'use client';
import { useEffect, useState } from 'react';

// Keep typing immediate while avoiding a request per keystroke.
export function useSearchInput() {
  const [search, setSearch] = useState('');
  const [settled, setSettled] = useState('');
  const value = search.trim();
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), 250);
    return () => window.clearTimeout(timer);
  }, [value]);
  return { search, setSearch, settled, pending: value !== settled };
}
