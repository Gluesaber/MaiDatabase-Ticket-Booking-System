export interface TagDto {
  typeId: number;
  typeName: string;
}

export interface User {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'organizer' | 'customer';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface EventInfo {
  eventId: number;
  title: string;
  tags: TagDto[];
  durationMinutes: number;
  rating: string;
  thumbnail: string;
}

export interface Venue {
  venueId: number;
  name: string;
  capacity: number;
}

export interface TicketTier {
  tierId: number;
  tierName: string;
  price: number;
  totalAmount: number;
  available: number;
}

export interface Showtime {
  showtimeId: number;
  event: EventInfo;
  venue: Venue;
  showSchedules: string;
  ticketPerPerson: number;
  tiers: TicketTier[];
}

export interface SeatInfo {
  seatCode: string;
  tierId: number;
  tierName: string;
  price: number;
  available: boolean;
}

export interface VenueLayout {
  venueId: number;
  venueName: string;
  capacity: number;
  seats: SeatInfo[];
}

export interface TicketItem {
  ticketId: number;
  seatCode: string;
  tierName: string;
  price: number;
  status: string;
}

export interface BookingResponse {
  bookingId: number;
  status: string;
  expiresAt: string;
  totalAmount: number;
  tickets: TicketItem[];
}

export interface BookingHistoryItem {
  bookingId: number;
  status: string;
  totalAmount: number;
  eventTitle: string;
  venueName: string;
  showSchedules: string;
  expiresAt: string | null;
  tickets: TicketItem[];
}

export interface VenueAddress {
  addressId: number;
  addressLine: string;
  street: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
}

export interface VenueDetail {
  venueId: number;
  name: string;
  capacity: number;
  address: VenueAddress;
}

export interface TierFormRow {
  tierName: string;
  price: string;
  totalAmount: string;
}

export interface CreateShowtimePayload {
  eventId: number;
  venueId: number;
  showSchedules: string;
  ticketPerPerson: number;
  tiers: { tierName: string; price: number; totalAmount: number }[];
}
