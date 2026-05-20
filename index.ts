import {groqService} from './services/groq';
import {cerebrasService} from './services/cerebras';
import {githubService} from './services/github';
import {huggingfaceService} from './services/huggingface';
import {azureOpenAIEmbedService} from './services/azure-openai';
import {openrouterService} from './services/openrouter';
import {geminiService} from './services/gemini';
import type { AIService, ChatMessage, EmbedService, EmbeddingRequest } from './types';

const servicesChat: AIService[] =[
        groqService,
	//cerebrasService,
	openrouterService,
        //geminiService
]

const servicesEmbed: EmbedService[] = [
	//huggingfaceService,
        azureOpenAIEmbedService,
        githubService
]

let currentChatIndex = 0;
let currentEmbedIndex = 0;

function getNextChatService(){
 const service = servicesChat[currentChatIndex];
 if (!service) {
  throw new Error('No chat services configured');
 }
 currentChatIndex = (currentChatIndex + 1) % servicesChat.length;
 return service;
};


function getNextEmbedService(): EmbedService {
  const service = servicesEmbed[currentEmbedIndex];
        if (!service) {
                throw new Error('No embedding services configured');
        }
  currentEmbedIndex = (currentEmbedIndex + 1) % servicesEmbed.length;
  return service;
};


const server = Bun.serve({
        port: process.env.PORT ?? 3002,
	idleTimeout: 60,
        async fetch(req){
          const { pathname } = new URL(req.url)

          if (req.method === 'POST' && pathname === '/chat'){
                const {messages, service: serviceName} = await req.json() as {
			messages: ChatMessage[]
			service?: string; 
		};

                const chatService = serviceName
                ? servicesChat.find(s => s.name === serviceName) || getNextChatService()
                : getNextChatService();

                console.log(`🤖 Using ${chatService.name} for chat`);

                try {
		  const tokenStream = await chatService.chat(messages);

	            return new Response(tokenStream, {
        	        headers : {
                	'Content-Type': 'text/event-stream',
                 	'Cache-Control': 'no-cache',
                 	'Connection': 'keep-alive',
			'Transfer-Encoding': 'chunked'
                	},
			status: 200
            	     });

        	} catch (error: any) {
		   console.error(`${chatService.name} failed:`, error.message);
		   return new Response(JSON.stringify({
                  	error: `${chatService.name} unavailable: ${error.message}`
                   }), {
                  	status: 503,
                  	headers: { 'Content-Type': 'application/json' }
                   });
		}
	}
        


	 if (req.method === 'POST' && pathname === '/embed'){
		 const { input } = await req.json() as EmbeddingRequest;
		 const embedService = getNextEmbedService();

                console.log(`📊 Using ${embedService.name} for embeddings (${input.length} tokens)`);
 		
                try {
                        const embeddings = await embedService.embed({ input });
                        	return Response.json(embeddings, {
                        	headers: { 'Access-Control-Allow-Origin': '*' }
                	});
                } catch (error: any) {
                        console.error(`${embedService.name} failed:`, error.message);
                        return new Response(JSON.stringify({
                        	error: `${embedService.name} unavailable: ${error.message}`
                }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                });
           }
	 }


	// 📋 Health check
        if (pathname === '/health') {
                return Response.json({
                status: 'ok',
                chatServices: servicesChat.map(s => s.name),
                //embedServices: servicesEmbed.map(s => s.name),
                uptime: process.uptime(),
            });
        }

         return new Response("Not found",{ status: 404});
    },
 });

 console.log(`🚀 Server ready: ${server.url}`);
 console.log(`🤖 Chat: POST /chat {messages}`);
 console.log(`📌 Embed: POST /embed {input}`);
 console.log(`✅ Health: GET /health`);
 console.log(`📈 Services: ${servicesChat.map(s => s.name).join(', ')} + ${servicesEmbed.map(s => s.name).join(', ')}`);
