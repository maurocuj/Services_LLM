import Cerebras from '@cerebras/cerebras_cloud_sdk';
import type {AIService, ChatMessage} from '../type';

const cerebras = new Cerebras();

export const cerebrasService: AIService = {
	name: 'Cerebras',
	async chat(messages: ChatMessage[]){
		const stream = await cerebras.chat.completions.create({
    			messages: messages as any,
    			model: 'qwen-3-235b-a22b-instruct-2507',
    			stream: true,
    			max_completion_tokens: 20000,
    			temperature: 0.7,
    			top_p: 0.8
  		});

		return (async function* (){
  			for await (const chunk of stream) {
    				yield (chunk as any).choices[0]?.delta?.content || ''
			}
		})()
    	}
}	
	
