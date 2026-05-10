import { useEffect, useState } from 'react';

function calcSeconds(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export function usePaymentCountdown(expiresAt: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    expiresAt ? calcSeconds(expiresAt) : 0
  );

  useEffect(() => {
    if (!expiresAt) return;
    setSecondsLeft(calcSeconds(expiresAt));
    const id = setInterval(() => setSecondsLeft(calcSeconds(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const expired = secondsLeft === 0 && expiresAt !== null;

  return { secondsLeft, minutes, seconds, expired };
}
