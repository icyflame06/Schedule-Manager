"use client";

import React, { useEffect, useState } from "react";
import { Availability } from "@/types";
import { db } from "@/lib/db";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Check, Calendar, AlertCircle } from "lucide-react";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TIME_SLOTS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  const formattedHour = hour.toString().padStart(2, "0");
  return `${formattedHour}:${min}`;
});

interface UI_Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function AvailabilityPage() {
  const { user } = useAuth();
  const [uiAvailabilities, setUiAvailabilities] = useState<UI_Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      if (user) {
        const data = await db.getAvailability(user.id);
        
        // Generate UI slots for all 7 days
        const mapped = Array.from({ length: 7 }, (_, i) => {
          const match = data.find((a) => a.day_of_week === i);
          return {
            day_of_week: i,
            start_time: match?.start_time || "09:00",
            end_time: match?.end_time || "17:00",
            is_active: !!match,
          };
        });
        
        setUiAvailabilities(mapped);
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleToggleActive = (index: number) => {
    setUiAvailabilities((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], is_active: !copy[index].is_active };
      return copy;
    });
  };

  const handleTimeChange = (index: number, key: "start_time" | "end_time", value: string) => {
    setUiAvailabilities((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    setError("");

    // Validate that start_time is before end_time for all active days
    const invalidDay = uiAvailabilities.find(
      (a) => a.is_active && a.start_time >= a.end_time
    );

    if (invalidDay) {
      setError(`Invalid hours on ${DAYS_OF_WEEK[invalidDay.day_of_week]}. Start time must be before end time.`);
      setSaving(false);
      return;
    }

    try {
      // Filter out inactive days and remove UI-only is_active key
      const activeAvailabilities: Availability[] = uiAvailabilities
        .filter((a) => a.is_active)
        .map((a) => ({
          id: `avail-${a.day_of_week}`,
          user_id: user?.id || "mock-user-id",
          day_of_week: a.day_of_week,
          start_time: a.start_time,
          end_time: a.end_time,
        }));

      await db.updateAvailability(activeAvailabilities);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Weekly Availability
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Define your operational hours during which guests can schedule events.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[120px]">
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : savedSuccess ? (
            <>
              <Check className="w-4 h-4" /> Saved!
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scheduler Layout */}
      <Card variant="glass" className="p-6">
        <div className="flex flex-col gap-5">
          {DAYS_OF_WEEK.map((dayName, idx) => {
            const avail = uiAvailabilities[idx];
            if (!avail) return null;

            return (
              <div
                key={dayName}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                  avail.is_active
                    ? "bg-slate-50 border-slate-200 shadow-sm"
                    : "bg-slate-100/30 border-slate-100 opacity-60"
                }`}
              >
                {/* Day Switch Toggle */}
                <div className="flex items-center gap-4 min-w-[150px]">
                  <button
                    onClick={() => handleToggleActive(idx)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                      avail.is_active
                        ? "bg-[var(--primary)]"
                        : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        avail.is_active ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="font-semibold text-slate-800">
                    {dayName}
                  </span>
                </div>

                {/* Hours selection */}
                {avail.is_active ? (
                  <div className="flex items-center gap-3 mt-3 sm:mt-0">
                    <select
                      value={avail.start_time}
                      onChange={(e) => handleTimeChange(idx, "start_time", e.target.value)}
                      className="px-3 py-2 rounded-xl text-sm text-slate-900 glass border-slate-200 focus:ring-2 focus:ring-[#FBBA00]/30"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={`start-${slot}`} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>

                    <span className="text-slate-400 text-sm font-semibold">to</span>

                    <select
                      value={avail.end_time}
                      onChange={(e) => handleTimeChange(idx, "end_time", e.target.value)}
                      className="px-3 py-2 rounded-xl text-sm text-slate-900 glass border-slate-200 focus:ring-2 focus:ring-[#FBBA00]/30"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={`end-${slot}`} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 mt-3 sm:mt-0 font-medium">
                    Unavailable
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
