export interface StockReport {
  id: string;
  date: string;
  summary: string;
  details: string;
  stocks: string[];
}

export interface StockPool {
  stocks: string[];
}
