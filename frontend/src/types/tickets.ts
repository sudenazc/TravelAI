export type EventCategory = "museum" | "networking" | "workshop" | "local";
export type TicketStatus = "upcoming" | "used" | "expired";

export interface EventResponse {
  id: string;
  title: string;
  category: EventCategory;
  image_url: string;
  date: string;
  time: string;
  location: string;
  price_usd: number;
  spots_left?: number | null;
}

export interface OwnedTicketResponse {
  id: string;
  event_id: string;
  event_title: string;
  date: string;
  location: string;
  status: TicketStatus;
  purchased_at: string;
}
