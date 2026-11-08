export interface WebsiteInsertInput {
  name: string;
  domain: string;
  dashboardAccessTokenHash: string;
  recoveryKeyHash: string;
  timezone: string;
}

export interface WebsiteInsertResult {
  id: string;
  name: string;
  domain: string;
  timezone: string;
  createdAt: string;
}

export interface WebsiteDatabaseRow {
  id: string;
  name: string;
  domain: string;
  timezone: string;
  created_at: string | Date;
}
