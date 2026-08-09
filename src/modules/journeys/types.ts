export type JourneyStatus = 'active' | 'completed';

export type Journey = {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  before_photo_uri: string | null;
  after_photo_uri: string | null;
  purpose_quote: string | null;
  status: JourneyStatus;
  created_at: string;
};