export interface CreateAgentInput {
  botName: string;
  tone: string;
  presentationGuidelines?: string;
  customInstructions?: string;
  llmConfig: Record<string, any>;
  intents: Record<string, any>[];
  flows: Record<string, any>[];
  tools?: Record<string, any>[];
  memorySchema?: Record<string, any>;
  security?: Record<string, any>;
  routing?: Record<string, any>;
  messageBufferMs?: number;
  webhookUrl: string;
  webhookSecret?: string;
  eventWebhooks?: Record<string, any>;
  knowledgeBase?: Record<string, any>;
  initialState?: Record<string, any>;
}

export interface UpdateAgentInput extends Partial<CreateAgentInput> {}

export interface AgentResponse {
  id: string;
  organizationId: string;
  version: number;
  isActive: boolean;
  botName: string;
  tone: string;
  presentationGuidelines?: string;
  customInstructions?: string;
  llmConfig: Record<string, any>;
  intents: Record<string, any>[];
  flows: Record<string, any>[];
  tools: Record<string, any>[];
  memorySchema?: Record<string, any>;
  security?: Record<string, any>;
  routing?: Record<string, any>;
  messageBufferMs: number;
  webhookUrl: string;
  webhookSecret?: string;
  eventWebhooks?: Record<string, any>;
  knowledgeBase?: Record<string, any>;
  initialState?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
