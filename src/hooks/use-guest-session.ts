'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'minimarket-guest-session-id';

function generateId(): string {
  // Simple unique id for guest sessions
  return `guest_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function getOrCreateGuestSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function useGuestSessionId(): string | undefined {
  const [sessionId, setSessionId] = useState<string>();

  useEffect(() => {
    try {
      const id = getOrCreateGuestSessionId();
      setSessionId(id);
    } catch (_) {
      // ignore
    }
  }, []);

  return sessionId;
}

