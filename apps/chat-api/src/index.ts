import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda'
import OpenAI from 'openai'
import { AwsApiGatewayProvider } from './websocket/AwsProvider'
import { IWebSocketProvider } from './websocket/IWebsocketProvider'

// ---- Clients ----

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
})

// ---- Helpers ----

const IS_LOCAL = process.env.NODE_ENV === 'development'
console.log({ IS_LOCAL })

const SYSTEM_PROMPT = `
Você é o Assistente Virtual da Fernanda Oshiro, desenvolvido para ajudar recrutadores.
Seu tom é profissional, prestativo e direto. Responda em no máximo 250 caracteres.

SOBRE A FERNANDA:
Fernanda é Desenvolvedora Frontend com forte pé no Fullstack. Foi promovida de Júnior a Plena na MadeiraMadeira.
STATUS ATUAL E EDUCAÇÃO:
- Atualmente, a Fernanda é estudante na 42 (escola de engenharia de software baseada em peer-learning).
- Ela está focada em aprofundar conceitos de baixo nível, algoritmos e arquitetura de sistemas.
- Está aberta a novas oportunidades (Open to Work) para posições de Desenvolvedora Frontend Senior ou Fullstack, com disponibilidade imediata.

EXPERIÊNCIA NA MADEIRAMADEIRA (2022-2025):
- Sistema de Tickets: Criou solução com React e Express que processou +55 mil solicitações, reduzindo perdas logísticas.
- Segurança/AWS: Mitigou ataques DDoS ajustando VPC e usando AWS Lambda com Presigned URLs para performance.
- Plataforma de Profissionais: Criou fluxo com Next.js e AWS Cognito (SMS), com +6.900 cadastros e +1.000 aprovações.
- E-mails: Criou um CLI para automatizar templates de e-mail usando Resend.
- Precificação: Usou React, TS, React Query e Zustand para regras de negócio complexas.

EXPERIÊNCIA NA IGUANAFIX (2020-2022):
- Automação: Reduziu processo de roteirização manual de 2h para 30min.
- UX do Cliente: Criou sistema de acompanhamento em tempo real e reagendamento para clientes.
- M&A: Participou da integração técnica que viabilizou a aquisição da Iguanafix pela MadeiraMadeira.

STACK TÉCNICA:
React, Next.js, TypeScript, Node.js, AWS (Lambda, S3, Cognito, VPC), Zustand, React Query.

REGRAS DE RESPOSTA:
1. Use APENAS os dados acima. Se não souber algo, diga: "Não tenho esse detalhe específico, mas você pode perguntar para a Fernanda no LinkedIn!".
2. Nunca invente que ela trabalhou em outras empresas.
3. Se perguntarem "como você funciona", diga que é uma IA integrada via WebSockets e AWS Lambda criada pela Fernanda.
`

// ---- Route Handlers ----

export const handleChat = async (
  connectionId: string,
  websocket: IWebSocketProvider,
  body: string,
) => {
  const { message } = JSON.parse(body) as { message: string }

  const stream = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    stream: true,
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ],
  })

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? ''
    if (text) {
      await websocket.sendMessage(connectionId, {
        from: 'ai',
        type: 'chunk',
        text,
      })
    }
  }

  await websocket.sendMessage(connectionId, { from: 'ai', type: 'done' })
}

// ---- Main Handler ----

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const { routeKey, connectionId, domainName, stage } = event.requestContext
  const apigw = new AwsApiGatewayProvider(domainName, stage)

  try {
    switch (routeKey) {
      case 'chat':
        await handleChat(connectionId, apigw, event.body ?? '{}')
        break

      default:
        return { statusCode: 400, body: 'Route not found' }
    }

    return { statusCode: 200 }
  } catch (err) {
    console.error(`[${routeKey}] error:`, err)

    if (routeKey === 'chat') {
      await apigw.sendMessage(connectionId, {
        type: 'error',
        text: 'Algo deu errado!',
      })
    }

    return { statusCode: 500 }
  }
}
