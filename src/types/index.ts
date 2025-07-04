export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface GeneratedModel {
    id: string;
    name: string;
    code: string;
    geometry?: any;
    timestamp: Date;
}

export interface LLMRequest {
    prompt: string;
    model?: string;
}

export interface LLMResponse {
    code: string;
    explanation?: string;
} 