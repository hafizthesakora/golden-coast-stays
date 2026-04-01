const LODGIFY_BASE = "https://api.lodgify.com/v2";

export interface BlockedRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

interface LodgifyCalendarEntry {
  date: string;
  available: number; // 0 = blocked, 1+ = available
}

export async function getLodgifyBlockedDates(
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<BlockedRange[]> {
  const url = new URL(`${LODGIFY_BASE}/calendar/rooms`);
  url.searchParams.set("roomTypeId", roomTypeId);
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);

  const res = await fetch(url.toString(), {
    headers: {
      "X-ApiKey": process.env.LODGIFY_API_KEY ?? "",
      "Accept": "application/json",
    },
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) {
    console.error(`Lodgify calendar fetch failed: ${res.status}`);
    return [];
  }

  const data: LodgifyCalendarEntry[] = await res.json();

  // Collapse consecutive blocked dates into ranges
  const blocked = data.filter((d) => d.available === 0).map((d) => d.date).sort();

  const ranges: BlockedRange[] = [];
  let rangeStart: string | null = null;
  let prev: string | null = null;

  for (const date of blocked) {
    if (!rangeStart) {
      rangeStart = date;
      prev = date;
      continue;
    }
    const prevMs = new Date(prev!).getTime();
    const currMs = new Date(date).getTime();
    if (currMs - prevMs === 86400000) {
      // consecutive
      prev = date;
    } else {
      ranges.push({ start: rangeStart, end: prev! });
      rangeStart = date;
      prev = date;
    }
  }
  if (rangeStart && prev) {
    ranges.push({ start: rangeStart, end: prev });
  }

  return ranges;
}

export function isDateRangeBlocked(
  checkIn: string,
  checkOut: string,
  blockedRanges: BlockedRange[]
): boolean {
  const inMs = new Date(checkIn).getTime();
  const outMs = new Date(checkOut).getTime();
  return blockedRanges.some(
    ({ start, end }) =>
      new Date(start).getTime() < outMs && new Date(end).getTime() >= inMs
  );
}
