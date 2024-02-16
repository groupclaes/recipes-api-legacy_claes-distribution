import Fastify from '@groupclaes/fastify-elastic'
import { FastifyInstance } from 'fastify'
import { env } from 'process'

import controller from './controller'

const LOGLEVEL = 'debug'

export default async function (config: any): Promise<FastifyInstance | undefined> {
  if (!config || !config.wrapper) return
  if (!config.wrapper.mssql && config.mssql) config.wrapper.mssql = config.mssql

  const fastify = await Fastify({ ...config.wrapper })
  await fastify.register(controller, { prefix: '/recipe', logLevel: LOGLEVEL })
  await fastify.listen({ port: +(env['PORT'] ?? 80), host: '::' })

  return fastify
}