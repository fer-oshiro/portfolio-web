import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda'
import twilio from 'twilio'

import { DynamoDbEventDeduplicator } from '../../adapters/aws/dynamodb-events'
import { loadCostGuardEnvironment } from '../../config/env'

interface CostGuardDependencies {
  claimEvent(id: string): Promise<boolean>
  notify(message: string, subject: string): Promise<void>
  subaccountAuthToken: string
  subaccountSid: string
  suspendSubaccount(): Promise<void>
  webhookUrl: string
}

const response = (statusCode: number, body = ''): APIGatewayProxyResultV2 => ({
  statusCode,
  body,
  headers: { 'content-type': 'text/plain; charset=utf-8' },
})

const parseBody = (event: APIGatewayProxyEventV2) => {
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body ?? '', 'base64').toString('utf8')
    : (event.body ?? '')
  return Object.fromEntries(new URLSearchParams(rawBody))
}

export const createCostGuardHandler = (dependencies: CostGuardDependencies) => {
  return async (
    event: APIGatewayProxyEventV2,
  ): Promise<APIGatewayProxyResultV2> => {
    if (event.requestContext.http.method !== 'POST') return response(405)

    const signature = event.headers['x-twilio-signature'] ?? ''
    const parameters = parseBody(event)
    const validSignature = twilio.validateRequest(
      dependencies.subaccountAuthToken,
      signature,
      dependencies.webhookUrl,
      parameters,
    )
    if (!validSignature) {
      console.warn(JSON.stringify({ securityEvent: 'twilio_signature_denied' }))
      return response(403, 'Forbidden')
    }

    if (
      parameters.AccountSid !== dependencies.subaccountSid ||
      parameters.UsageCategory !== 'totalprice' ||
      parameters.TriggerBy !== 'price'
    ) {
      console.warn(JSON.stringify({ securityEvent: 'twilio_trigger_ignored' }))
      return response(400, 'Unexpected trigger')
    }

    const idempotencyToken = parameters.IdempotencyToken
    if (!idempotencyToken) return response(400, 'Missing idempotency token')
    if (!(await dependencies.claimEvent(idempotencyToken))) return response(204)

    const triggerValue = Number(parameters.TriggerValue)
    if (parameters.Recurring === 'daily' && triggerValue === 2) {
      await dependencies.suspendSubaccount()
      console.error(JSON.stringify({ securityEvent: 'twilio_suspended' }))
      await dependencies.notify(
        'A subconta Twilio do portfólio foi suspensa após atingir o limite diário de US$2.',
        'Portfolio: Twilio suspensa',
      )
      return response(204)
    }

    if (parameters.Recurring === 'monthly' && triggerValue === 5) {
      console.warn(JSON.stringify({ securityEvent: 'twilio_monthly_alert' }))
      await dependencies.notify(
        'A subconta Twilio do portfólio atingiu o alerta mensal de US$5.',
        'Portfolio: alerta mensal Twilio',
      )
      return response(204)
    }

    return response(400, 'Unexpected threshold')
  }
}

let defaultHandler: ReturnType<typeof createCostGuardHandler> | undefined

export const handler: ReturnType<typeof createCostGuardHandler> = (event) => {
  if (!defaultHandler) {
    const environment = loadCostGuardEnvironment()
    const dynamo = new DynamoDBClient({ region: environment.awsRegion })
    const sns = new SNSClient({ region: environment.awsRegion })
    const parentClient = twilio(
      environment.twilioParentAccountSid,
      environment.twilioParentAuthToken,
    )
    const deduplicator = new DynamoDbEventDeduplicator(
      environment.idempotencyTableName,
      dynamo,
    )

    defaultHandler = createCostGuardHandler({
      claimEvent: (id) => deduplicator.claim(id),
      notify: async (message, subject) => {
        await sns.send(
          new PublishCommand({
            Message: message,
            Subject: subject,
            TopicArn: environment.notificationTopicArn,
          }),
        )
      },
      subaccountAuthToken: environment.twilioSubaccountAuthToken,
      subaccountSid: environment.twilioSubaccountSid,
      suspendSubaccount: async () => {
        await parentClient.api.v2010
          .accounts(environment.twilioSubaccountSid)
          .update({ status: 'suspended' })
      },
      webhookUrl: environment.webhookUrl,
    })
  }

  return defaultHandler(event)
}
