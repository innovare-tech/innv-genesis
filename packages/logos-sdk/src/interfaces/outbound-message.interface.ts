/**
 * Mensagens ricas emitidas pelo bot do Logos Engine via webhook
 * (`BotDecision.messages[]`).
 *
 * Espelha o vocabulário do engine (`ms-innv-logos-engine`
 * `orchestrator/interfaces/outbound-message.interface.ts`). Mantido
 * self-contained no SDK para que consumers (ex: `ms-innv-unic-core`)
 * tipem o array sem depender do engine. Estritamente aditivo: consumers
 * antigos que só leem `BotDecision.message` ignoram este array.
 */

export type OutboundMessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'AUDIO'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'LOCATION'
  | 'PRODUCT'
  | 'PRODUCT_CAROUSEL'
  | 'INTERACTIVE';

/** Balão de texto padrão. */
export interface TextOutboundMessage {
  type: 'TEXT';
  text: string;
}

/** Mídia binária (imagem/áudio/vídeo/documento). */
export interface MediaOutboundMessage {
  type: 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';
  url: string;
  mimeType?: string;
  caption?: string;
  fileName?: string;
  fallbackText?: string;
}

/** Coordenada geográfica. */
export interface LocationOutboundMessage {
  type: 'LOCATION';
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  fallbackText?: string;
}

/**
 * Card de produto / carousel. Shape mantido permissivo no SDK (o detalhe
 * do produto canônico vive no engine); consumers que não renderizam
 * produtos usam `fallbackText`/`headerText`.
 */
export interface ProductOutboundMessage {
  type: 'PRODUCT';
  product: Record<string, any>;
  headerText?: string;
  fallbackText?: string;
}

export interface ProductCarouselOutboundMessage {
  type: 'PRODUCT_CAROUSEL';
  products: Record<string, any>[];
  headerText?: string;
  fallbackText?: string;
}

/** Botão de resposta rápida (quick-reply) de uma mensagem interativa. */
export interface InteractiveButton {
  /** Payload de roteamento devolvido quando o usuário clica. */
  id: string;
  /** Rótulo exibido no botão (limite Meta: 20 chars). */
  title: string;
}

/** Linha de uma seção de lista interativa. */
export interface InteractiveRow {
  /** Payload de roteamento devolvido quando o usuário seleciona. */
  id: string;
  /** Título da linha (limite Meta: 24 chars). */
  title: string;
  /** Descrição secundária opcional (limite Meta: 72 chars). */
  description?: string;
}

/** Seção agrupadora de linhas em uma lista interativa. */
export interface InteractiveSection {
  title?: string;
  rows: InteractiveRow[];
}

/**
 * Menu interativo (botões de resposta ou lista de opções). Mapeia ao
 * `interactive` do WhatsApp Cloud API. O consumer roteia
 * `interactiveType === 'button'` → reply buttons (até 3) e `'list'` →
 * `buttonText` + `sections.rows` (até 10 linhas no total).
 */
export interface InteractiveOutboundMessage {
  type: 'INTERACTIVE';
  interactiveType: 'button' | 'list';
  body: string;
  header?: string;
  footer?: string;
  buttons?: InteractiveButton[];
  buttonText?: string;
  sections?: InteractiveSection[];
  fallbackText?: string;
}

/** Union discriminada por `type`. */
export type OutboundMessage =
  | TextOutboundMessage
  | MediaOutboundMessage
  | LocationOutboundMessage
  | ProductOutboundMessage
  | ProductCarouselOutboundMessage
  | InteractiveOutboundMessage;
