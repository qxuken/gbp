import { useEffect, useState } from 'react';

/**
 * @param timeoutDuration Time in seconds before the button is re-enabled.
 */
export function useTimeoutButton(
  timeoutDuration: number = 60,
  startAtInit = false,
) {
  const [timeLeft, setTimeLeft] = useState(() =>
    startAtInit ? timeoutDuration : 0,
  );

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const triggerTimeout = () => {
    setTimeLeft(timeoutDuration);
  };

  return [timeLeft, triggerTimeout] as const;
}
