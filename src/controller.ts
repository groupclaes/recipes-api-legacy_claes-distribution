import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import LegacyRecipe from './legacy-recipe.repository'
import sql from 'mssql'

declare module 'fastify' {
  export interface FastifyInstance {
    getSqlPool: (name?: string) => Promise<sql.ConnectionPool>
  }

  export interface FastifyReply {
    success: (data?: any, code?: number, executionTime?: number) => FastifyReply
    fail: (data?: any, code?: number, executionTime?: number) => FastifyReply
    error: (message?: string, code?: number, executionTime?: number) => FastifyReply
  }
}

export default async function (fastify: FastifyInstance) {
  async function handleRequest(request: FastifyRequest<{
    Params: {
      id?: number
    }
  }>, reply: FastifyReply) {
    const start = performance.now()
    try {
      const id = request.params.id
      let culture = 'nl'

      if (request.headers["accept-language"])
        culture = `${request.headers["accept-language"]}`.substring(2)

      if (!id) {
        request.log.info('No id provided, falling back to discovery')
        return fallback(reply, culture)
      } else {
        // try to find recipe info based on id and culture
        const pool = await fastify.getSqlPool()
        const repo = new LegacyRecipe(request.log, pool)
        const recipe = await repo.read(id, culture)

        if (!recipe) {
          request.log.warn({ recipe: { id: id } },
            'Recipe not found, falling back to discovery')
          return fallback(reply, culture)
        }
        if (recipe.error) {
          request.log.error({ err: recipe.error, id }, recipe.error)
          return reply.error(recipe.error, 500, performance.now() - start)
        }
        request.log.info({ recipe: recipe.result },
          'Found recipe')
        return resolve(reply, recipe.result.id, culture, recipe.result.title)
      }
    } catch (err) {
      request.log.error({ err }, 'failed to get legacy recipe!')
      return reply.error(err?.message, 500, performance.now() - start)
    }
  }

  fastify.get('', handleRequest)
  fastify.get('/:id', handleRequest)
  fastify.get('/:id/:name', handleRequest)
}

// https://www.claes-distribution.be/recettes/389/witte-wijnsaus

function resolve(reply: FastifyReply, id: number, culture: string, name: string) {
  const encodedName = encodePath(name)
  switch (culture) {
    default:
    case 'en':
      return reply
        .code(301)
        .header('Content-Security-Policy', `default-src 'www.claes-distribution.be'`)
        .redirect(`https://www.claes-distribution.be/recipes/${id}/${encodedName}`)

    case 'nl':
      return reply
        .code(301)
        .header('Content-Security-Policy', `default-src 'www.claes-distribution.be'`)
        .redirect(`https://www.claes-distribution.be/recepten/${id}/${encodedName}`)

    case 'fr':
      return reply
        .code(301)
        .header('Content-Security-Policy', `default-src 'www.claes-distribution.be'`)
        .redirect(`https://www.claes-distribution.be/recettes/${id}/${encodedName}`)
  }
}

function fallback(reply: FastifyReply, culture: string) {
  switch (culture) {
    default:
    case 'en':
      return reply
        .code(301)
        .header('Content-Security-Policy', `default-src 'www.claes-distribution.be'`)
        .redirect('https://www.claes-distribution.be/recipes/discover')

    case 'nl':
      return reply
        .code(301)
        .header('Content-Security-Policy', `default-src 'www.claes-distribution.be'`)
        .redirect('https://www.claes-distribution.be/recepten/ontdek')

    case 'fr':
      return reply
        .code(301)
        .header('Content-Security-Policy', `default-src 'www.claes-distribution.be'`)
        .redirect('https://www.claes-distribution.be/recettes/decouvrir')
  }
}

/**
 * 
 * @param {string} path 
 * @returns 
 */
function encodePath(path) {
  return encodeURI(path.replace(/ /g, '-'))
}