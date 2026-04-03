export interface IngestMessage {
  sessionId: string;
  input: string;
  contactReference: string;
  metadata?: Record<string, any>;
  media?: any[];
}

export interface IngestResponse {
  messageId: string;
  sessionId: string;
}
