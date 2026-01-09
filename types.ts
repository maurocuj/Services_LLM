type ChatContent = string | Array<{
	type: 'text' | 'image_url';
	text?: string;
	image_url?: {url:string};
}>;

export interface ChatMessage {
	role:'user' | 'assistant' | 'system';
	content: ChatContent;
}

export interface AIService {
	name: string;
	chat: (messages:ChatMessage[]) => Promise<AsyncIterable<string>>;
}
