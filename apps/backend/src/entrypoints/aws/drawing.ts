import { clientMessageSchema } from '@fer-oshiro/realtime-contract'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { S3Client } from '@aws-sdk/client-s3'
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda'

import { ApiGatewayMessagePublisher } from '../../adapters/aws/api-gateway-publisher'
import { DynamoDbQuotaRepository } from '../../adapters/aws/dynamodb-quotas'
import { DynamoDbSessionRepository } from '../../adapters/aws/dynamodb-sessions'
import { S3DrawingStorage } from '../../adapters/aws/s3-drawings'
import { loadDrawingEnvironment } from '../../config/env'
import { DrawingService } from '../../features/drawing'
import { SecurityService } from '../../features/security'
import { resolveSessionContext, respondToSecurityError } from './security'

// ---- Main Handler ----

const environment = loadDrawingEnvironment()
const storage = new S3DrawingStorage(
  new S3Client({ region: environment.awsRegion }),
  {
    bucket: environment.drawingsBucket,
    maxUploadBytes: environment.maxUploadBytes,
    publicBaseUrl: environment.drawingsPublicBaseUrl,
    uploadExpiresInSeconds: environment.uploadExpiresInSeconds,
  },
)
const security = new SecurityService(
  new DynamoDbQuotaRepository(
    environment.quotasTableName,
    new DynamoDBClient({ region: environment.awsRegion }),
  ),
  environment.quotaLimits,
)
const sessions = new DynamoDbSessionRepository(
  environment.quotasTableName,
  new DynamoDBClient({ region: environment.awsRegion }),
)

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const { routeKey, connectionId, domainName, stage } = event.requestContext
  const publisher = new ApiGatewayMessagePublisher(domainName, stage)
  const drawing = new DrawingService({ storage, publisher })

  try {
    switch (routeKey) {
      case 'get_drawings':
        await security.consume({
          action: 'get_drawings',
          requestId: event.requestContext.requestId,
          session: await resolveSessionContext(event, sessions),
        })
        await drawing.list(connectionId)
        break
      case 'save_drawing': {
        const value: unknown = JSON.parse(event.body ?? '{}')
        const parsed = clientMessageSchema.safeParse(value)
        if (!parsed.success || parsed.data.action !== 'save_drawing') {
          throw new Error('Invalid drawing message')
        }

        await security.consume({
          action: 'save_drawing',
          requestId: event.requestContext.requestId,
          session: await resolveSessionContext(event, sessions),
        })
        await drawing.createUpload(connectionId, parsed.data.name)
        break
      }

      default:
        return { statusCode: 400, body: 'Route not found' }
    }

    return { statusCode: 200 }
  } catch (err) {
    console.error(`[${routeKey}] error:`, err)

    const securityResponse = await respondToSecurityError(
      err,
      connectionId,
      publisher,
    )
    if (securityResponse) return securityResponse

    await publisher.send(connectionId, {
      type: 'error',
      source: 'draw',
      code: 'INTERNAL_ERROR',
      message: 'Não foi possível processar o desenho.',
    })

    return { statusCode: 500 }
  }
}
