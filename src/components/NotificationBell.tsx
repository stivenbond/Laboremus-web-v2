'use client';

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationEvent {
  type: string;
  userId: string;
  message: string;
  timestamp?: string;
}

export default function NotificationBell() {
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [unread, setUnread] = useState(0);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/notifications/stream");
    sourceRef.current = es;

    es.onmessage = (e) => {
      const data: NotificationEvent = JSON.parse(e.data);
      if (data.type === "connected") return; // skip ping
      setEvents((prev) => [data, ...prev].slice(0, 20)); // keep last 20
      setUnread((n) => n + 1);
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, []);

  const handleOpen = () => setUnread(0);

  return (
    <DropdownMenu onOpenChange={(open) => open && handleOpen()}>
      <DropdownMenuTrigger className="relative flex items-center justify-center p-2 rounded-md hover:bg-muted cursor-pointer">
        {/* Bell SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unread > 9 ? "9+" : unread}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {events.length === 0 ? (
          <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
        ) : (
          events.map((ev, i) => (
            <DropdownMenuItem key={i} className="flex flex-col items-start gap-1 py-2">
              <span className="font-medium text-sm capitalize">{ev.type.replace(/_/g, " ").toLowerCase()}</span>
              <span className="text-xs text-muted-foreground">{ev.message}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
