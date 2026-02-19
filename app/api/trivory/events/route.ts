import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TRIVORY_BASE_URL = "https://app.trivory.com/api/v1";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { api_key, start_date, end_date } = body;

    if (!api_key) {
      return NextResponse.json(
        { error: "api_key is required" },
        { status: 400 },
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${String(api_key).replace(/[\r\n]/g, "")}`,
    };

    const params = new URLSearchParams();
    if (start_date) params.set("start_date", String(start_date));
    if (end_date) params.set("end_date", String(end_date));

    const [eventsRes, announcementsRes] = await Promise.allSettled([
      fetch(
        `${TRIVORY_BASE_URL}/events${params.toString() ? `?${params}` : ""}`,
        { headers },
      ),
      fetch(`${TRIVORY_BASE_URL}/announcements`, { headers }),
    ]);

    const events: TrivoryEvent[] = [];
    const announcements: TrivoryAnnouncement[] = [];

    if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
      const data = await eventsRes.value.json().catch(() => null);
      if (Array.isArray(data)) {
        events.push(...data);
      } else if (data && Array.isArray(data.events)) {
        events.push(...data.events);
      } else if (data && Array.isArray(data.data)) {
        events.push(...data.data);
      }
    }

    if (announcementsRes.status === "fulfilled" && announcementsRes.value.ok) {
      const data = await announcementsRes.value.json().catch(() => null);
      if (Array.isArray(data)) {
        announcements.push(...data);
      } else if (data && Array.isArray(data.announcements)) {
        announcements.push(...data.announcements);
      } else if (data && Array.isArray(data.data)) {
        announcements.push(...data.data);
      }
    }

    return NextResponse.json({ events, announcements }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface TrivoryEvent {
  id?: string | number;
  title?: string;
  name?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  date?: string;
  type?: string;
  description?: string;
  location?: string;
  is_class?: boolean;
  course?: string;
  teacher?: string;
}

interface TrivoryAnnouncement {
  id?: string | number;
  title?: string;
  body?: string;
  content?: string;
  created_at?: string;
  date?: string;
  author?: string;
}
