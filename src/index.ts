import Fastify from '@groupclaes/fastify-elastic'
import { FastifyInstance } from 'fastify'
import { env } from 'process'

import controller from './controller'

const LOGLEVEL = 'info'

export default async function (config: any): Promise<FastifyInstance | undefined> {
  if (!config || !config.wrapper) return

  const fastify = await Fastify({ ...config.wrapper })
  fastify.log.level = LOGLEVEL
  await fastify.register(controller, { prefix: '/recipe', logLevel: LOGLEVEL })
  await fastify.listen({ port: +(env['PORT'] ?? 80), host: '::' })

  return fastify
}