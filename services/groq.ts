import { Groq } from 'groq-sdk';
import type {AIService, ChatMessage} from '../types';

const groq = new Groq();

export const groqService: AIService = {
 name : 'Groq',
 async chat(messages: ChatMessage[]){ 
 	const chatCompletion = await groq.chat.completions.create({
  		messages,
  		model: "meta-llama/llama-4-scout-17b-16e-instruct",
  		temperature: 1,
  		max_completion_tokens: 1024,
  		top_p: 1,
  		stream: true,
  		stop: null
 	});
        
	return (async function* (){
		for await (const chunk of chatCompletion){
		 yield chunk.choices[0]?.delta?.content || ''
		}			
	})()
   }
}
