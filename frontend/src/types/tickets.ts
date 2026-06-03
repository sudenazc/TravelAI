export type EventCategory = "museum" | "networking" | "workshop" | "local";
export type TicketStatus = "upcoming" | "used" | "expired";

export type OpportunityCategory =
  | "Museum"
  | "Concert"
  | "Art"
  | "Hotel"
  | "Workshop"
  | "Festival"
  | "Networking";

export type OpportunityStatus = "available" | "claimed" | "expired";

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

export interface OpportunityResponse {
  id: string;
  title: string;
  description: string | null;
  city: string;
  category: OpportunityCategory;
  provider_name: string | null;
  original_price: number | null;
  offer_price: number | null;
  is_free: boolean;
  status: OpportunityStatus;
  is_last_minute: boolean;
  expires_at: string | null;
  event_date: string | null;
}

export interface ClaimedOpportunityResponse extends OpportunityResponse {
  claim_code: string | null;
}
