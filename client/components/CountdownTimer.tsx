import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
}

export function CountdownTimer({
  targetDate,
  onComplete,
  className = "",
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTime(targetDate)
  );

  function calculateTime(target: Date): TimeRemaining {
    const now = new Date().getTime();
    const distance = target.getTime() - now;

    if (distance <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
    }

    return {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((distance / 1000 / 60) % 60),
      seconds: Math.floor((distance / 1000) % 60),
      isComplete: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTime(targetDate);
      setTimeRemaining(newTime);

      if (newTime.isComplete && onComplete) {
        onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (timeRemaining.isComplete) {
    return (
      <div className={className}>
        <p className="text-destructive font-bold">Phase Complete</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex gap-4 items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-black text-primary">
            {String(timeRemaining.days).padStart(2, "0")}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Days
          </div>
        </div>
        <div className="text-2xl font-black text-muted-foreground">:</div>
        <div className="text-center">
          <div className="text-3xl font-black text-primary">
            {String(timeRemaining.hours).padStart(2, "0")}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Hours
          </div>
        </div>
        <div className="text-2xl font-black text-muted-foreground">:</div>
        <div className="text-center">
          <div className="text-3xl font-black text-primary">
            {String(timeRemaining.minutes).padStart(2, "0")}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Minutes
          </div>
        </div>
        <div className="text-2xl font-black text-muted-foreground">:</div>
        <div className="text-center">
          <div className="text-3xl font-black text-primary">
            {String(timeRemaining.seconds).padStart(2, "0")}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Seconds
          </div>
        </div>
      </div>
    </div>
  );
}
