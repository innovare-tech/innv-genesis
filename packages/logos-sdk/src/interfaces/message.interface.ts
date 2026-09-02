/**
 * Resposta a um menu interativo: o `id`/payload de roteamento do botão ou
 * linha de lista que o usuário clicou. Preservado ponta a ponta
 * (WhatsApp → unic-core → engine) para permitir roteamento determinístico
 * pela opção escolhida, não só pelo texto exibido.
 */
export interface InteractiveReply {
  /** Payload/id da opção selecionada (definido em `InteractiveButton.id` ou `InteractiveRow.id`). */
  id: string;
  /** Título exibido da opção escolhida (o que o usuário viu). */
  title?: string;
  /** Origem da seleção: botão de resposta ou linha de lista. */
  source?: 'button' | 'list';
}

export interface IngestMessage {
  sessionId: string;
  input: string;
  contactReference: string;
  metadata?: Record<string, any>;
  media?: any[];
  /**
   * Presente quando `input` veio do clique em um menu interativo. Aditivo:
   * ingests de texto puro não preenchem. O engine prioriza
   * `interactiveReply.id` no roteamento por payload quando disponível.
   */
  interactiveReply?: InteractiveReply;
}

export interface IngestResponse {
  messageId: string;
  sessionId: string;
}
