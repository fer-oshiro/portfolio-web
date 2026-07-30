import { clientMessageSchema } from '@fer-oshiro/realtime-contract'
import { S3Client } from '@aws-sdk/client-s3'
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda'

import { ApiGatewayMessagePublisher } from '../../adapters/aws/api-gateway-publisher'
import { S3DrawingStorage } from '../../adapters/aws/s3-drawings'
import { DrawingService } from '../../features/drawing'

// ---- Main Handler ----

const storage = new S3DrawingStorage(new S3Client({ region: 'us-east-1' }), {
  bucket: process.env.BUCKET!,
  publicBaseUrl: 'https://fer-oshiro.com',
})

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const { routeKey, connectionId, domainName, stage } = event.requestContext
  const publisher = new ApiGatewayMessagePublisher(domainName, stage)
  const drawing = new DrawingService({ storage, publisher })

  try {
    switch (routeKey) {
      case 'get_drawings':
        await drawing.list(connectionId)
        break
      case 'save_drawing': {
        const value: unknown = JSON.parse(event.body ?? '{}')
        const parsed = clientMessageSchema.safeParse(value)
        if (!parsed.success || parsed.data.action !== 'save_drawing') {
          throw new Error('Invalid drawing message')
        }

        await drawing.createUpload(connectionId, parsed.data.name)
        break
      }

      default:
        return { statusCode: 400, body: 'Route not found' }
    }

    return { statusCode: 200 }
  } catch (err) {
    console.error(`[${routeKey}] error:`, err)

    await publisher.send(connectionId, {
      type: 'error',
      source: 'draw',
      code: 'INTERNAL_ERROR',
      message: 'Não foi possível processar o desenho.',
    })

    return { statusCode: 500 }
  }
}
