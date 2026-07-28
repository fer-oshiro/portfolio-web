import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda'
import { AwsApiGatewayProvider } from './websocket/AwsProvider'
import { IWebSocketProvider } from './websocket/IWebsocketProvider'

// ---- Helpers ----

const IS_LOCAL = process.env.NODE_ENV === 'development'
const BUCKET = 'fer-oshiro-portfolio-drawings'
const CDN_DOMAIN = 'fer-oshiro.com'

export const handleSave = async (
  connectionId: string,
  websocket: IWebSocketProvider,
  body: string,
) => {
  const { message } = JSON.parse(body) as { message: string }
  const objectKey = `submissions/${Date.now()}-${message}`
  const client = new S3Client({ region: 'us-east-1' })
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
    ContentType: 'image/svg+xml',
  })
  const url = await getSignedUrl(client, command, { expiresIn: 3600 })
  await websocket.sendMessage(connectionId, {
    from: 'url_draw',
    text: url,
    type: 'done',
  })
}

const getNameFromKey = (key?: string) => {
  if (!key) return ''
  const fileName = key.split('/').pop() ?? ''
  const name = fileName.replace(/^\d+-/, '').replace('.svg', '')
  return name
}

export const handleDrawings = async (
  connectionId: string,
  websocket: IWebSocketProvider,
) => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: 'gallery/',
    MaxKeys: 20,
  })
  const client = new S3Client({ region: 'us-east-1' })
  const { Contents } = await client.send(command)
  const drawings = (Contents || [])
    .sort((a, b) => (!!a.Key && !!b.Key ? b.Key.localeCompare(a.Key) : 0))
    .map((item) => ({
      url: `https://${CDN_DOMAIN}/${item.Key}`,
      id: getNameFromKey(item.Key),
    }))
    .filter((item) => item.id)
  await websocket.sendMessage(connectionId, { drawings })
}

// ---- Main Handler ----

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const { routeKey, connectionId, domainName, stage } = event.requestContext
  const apigw = new AwsApiGatewayProvider(domainName, stage)

  try {
    switch (routeKey) {
      case 'get_drawings':
        await handleDrawings(connectionId, apigw)
        break
      case 'save_drawing':
        await handleSave(connectionId, apigw, event.body ?? '{}')
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
