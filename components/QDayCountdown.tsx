"use client";

import { useEffect, useMemo, useState } from "react";

const Q_DAY_TARGET = new Date("2030-01-01T00:00:00.000Z");

type CountdownParts = {
  years: number;
  days: number;
  hours: number;
  minutes: number;
};

function getCountdownParts(now: Date): CountdownParts {
  if (now >= Q_DAY_TARGET) {
    return { years: 0, days: 0, hours: 0, minutes: 0 };
  }

  const cursor = new Date(now.getTime());
  let years = 0;

  // Count full years first, then break down the remainder.
  while (true) {
    const next = new Date(cursor.getTime());
    next.setUTCFullYear(next.getUTCFullYear() + 1);

    if (next <= Q_DAY_TARGET) {
      years += 1;
      cursor.setTime(next.getTime());
    } else {
      break;
    }
  }

  const remainingMs = Q_DAY_TARGET.getTime() - cursor.getTime();
  const totalMinutes = Math.floor(remainingMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { years, days, hours, minutes };
}

export default function QDayCountdown() {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const countdown = useMemo(() => getCountdownParts(now), [now]);

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-4 -mt-8 mb-10">
      <div
        className="rounded-3xl border border-amber-400/20 p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(124,58,237,0.05) 100%)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
              Q-Day Countdown
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Time left until January 1, 2030
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Estimated date when quantum attacks become practical
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-3xl font-black text-amber-300">
              {countdown.years}
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">
              Years
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-3xl font-black text-violet-300">
              {countdown.days}
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">
              Days
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-3xl font-black text-cyan-300">
              {countdown.hours}
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">
              Hours
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-3xl font-black text-emerald-300">
              {countdown.minutes}
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">
              Minutes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
