import { useEffect } from 'react';
import { usePaymentCountdown } from '../hooks/usePaymentCountdown';

interface Props {
  expiresAt: string;
  onExpired: () => void;
}

export function PaymentCountdownBanner({ expiresAt, onExpired }: Props) {
  const { minutes, seconds, expired } = usePaymentCountdown(expiresAt);

  useEffect(() => {
    if (expired) onExpired();
  }, [expired, onExpired]);

  if (expired) return null;

  const urgent = minutes === 0 && seconds <= 60;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 py-2 text-center text-white text-sm font-semibold ${urgent ? 'bg-red-600' : 'bg-orange-500'}`}>
      Complete payment within {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')} or your booking will be cancelled
    </div>
  );
}
