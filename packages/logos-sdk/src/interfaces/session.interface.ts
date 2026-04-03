export interface SessionResponse {
  id: string;
  organizationId: string;
  agentId: string;
  sessionId: string;
  contactReference: string;
  status: 'ACTIVE' | 'CLOSED';
  agentState: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
