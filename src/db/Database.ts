export interface StatsTable {
  pathname: string;
  count: number;
  type: string;
}

interface Database {
  stats: StatsTable;
}

export default Database;
