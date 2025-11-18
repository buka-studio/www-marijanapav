export interface StatsTable {
  pathname: string;
  count: number;
  type: string;
}

export interface FeedbackTable {
  id: number;
  feedback_id: string;
  message: string;
  ua: string | null;
  created_at: string;
  meta: unknown;
}

interface Database {
  stats: StatsTable;
  feedback: FeedbackTable;
}

export default Database;
