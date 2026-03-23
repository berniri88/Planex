/**
 * Timezone Utilities — Powers the "Traveler's Clock" feature.
 * Uses Intl.DateTimeFormat for accurate IANA timezone conversions.
 */

export interface TimezoneInfo {
  /** Time displayed in the destination timezone */
  localTime: string;
  /** Time displayed in the user's home timezone */
  homeTime: string;
  /** Timezone abbreviation (e.g. "CET", "JST") */
  abbreviation: string;
  /** Destination timezone name (e.g. "Europe/Paris") */
  timezone: string;
  /** Human readable delta (e.g. "In 3 hours", "2 days ago") */
  delta: string;
  /** Offset difference in hours between home and destination */
  offsetDiffHours: number;
  /** Whether the event is happening now */
  isNow: boolean;
  /** Whether the event is in the past */
  isPast: boolean;
}

/**
 * Get the user's current timezone from their device.
 */
export function getHomeTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format a date in a specific timezone.
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaults: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
    ...options,
  };
  return new Intl.DateTimeFormat('en-US', defaults).format(date);
}

/**
 * Get a short timezone abbreviation like "CET", "JST", "EST".
 */
export function getTimezoneAbbr(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  }).formatToParts(date);
  
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  return tzPart?.value ?? timezone.split('/').pop()?.replace('_', ' ') ?? '';
}

/**
 * Calculate the UTC offset in hours for a timezone at a given date.
 */
function getOffsetHours(date: Date, timezone: string): number {
  const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = date.toLocaleString('en-US', { timeZone: timezone });
  const diffMs = new Date(tzStr).getTime() - new Date(utcStr).getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Generate human-readable time delta (e.g. "In 3 hours", "2 days ago").
 */
export function getTimeDelta(eventDate: Date): string {
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);

  const minutes = Math.floor(absDiffMs / (1000 * 60));
  const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
  const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));

  const isFuture = diffMs > 0;

  if (minutes < 5) return 'Now';
  if (minutes < 60) return isFuture ? `In ${minutes}m` : `${minutes}m ago`;
  if (hours < 24) return isFuture ? `In ${hours}h` : `${hours}h ago`;
  if (days === 1) return isFuture ? 'Tomorrow' : 'Yesterday';
  if (days < 7) return isFuture ? `In ${days} days` : `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return isFuture ? `In ${weeks}w` : `${weeks}w ago`;
  }
  
  return eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Full timezone info for an event — this is the core of the Traveler's Clock.
 */
export function getTravelerClockInfo(
  eventDateISO: string,
  destinationTimezone: string
): TimezoneInfo {
  const eventDate = new Date(eventDateISO);
  const homeTimezone = getHomeTimezone();

  const localTime = formatInTimezone(eventDate, destinationTimezone);
  const homeTime = formatInTimezone(eventDate, homeTimezone);
  const abbreviation = getTimezoneAbbr(eventDate, destinationTimezone);
  const delta = getTimeDelta(eventDate);

  const homeOffset = getOffsetHours(eventDate, homeTimezone);
  const destOffset = getOffsetHours(eventDate, destinationTimezone);
  const offsetDiffHours = destOffset - homeOffset;

  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const isNow = Math.abs(diffMs) < 5 * 60 * 1000; // within 5 minutes
  const isPast = diffMs < -5 * 60 * 1000;

  return {
    localTime,
    homeTime,
    abbreviation,
    timezone: destinationTimezone,
    delta,
    offsetDiffHours,
    isNow,
    isPast,
  };
}
