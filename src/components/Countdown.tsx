"use client";

import { useEffect, useMemo, useState } from "react";

type CountdownProps = {
  targetIso: string;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function getTimeLeft(targetMs: number): TimeLeft {
  const remaining = targetMs - Date.now();
  if (remaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, expired: false };
}

export function Countdown({ targetIso }: CountdownProps) {
  const targetMs = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTimeLeft(getTimeLeft(targetMs));
    });

    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft(targetMs));
    }, 1000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [targetMs]);

  if (!timeLeft) {
    return (
      <div className="countdown" aria-label="Countdown loading">
        {["days", "hours", "min", "sec"].map((unit) => (
          <span key={unit}>
            <strong>--</strong>
            {unit}
          </span>
        ))}
      </div>
    );
  }

  if (timeLeft.expired) {
    return <p className="countdown-expired">Prediction window reached. Time to score the guess.</p>;
  }

  return (
    <div className="countdown" aria-label="Countdown to prediction">
      <span>
        <strong>{timeLeft.days}</strong>
        days
      </span>
      <span>
        <strong>{timeLeft.hours.toString().padStart(2, "0")}</strong>
        hours
      </span>
      <span>
        <strong>{timeLeft.minutes.toString().padStart(2, "0")}</strong>
        min
      </span>
      <span>
        <strong>{timeLeft.seconds.toString().padStart(2, "0")}</strong>
        sec
      </span>
    </div>
  );
}
