import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class LegacyRecipe {
  schema: string = 'recipe.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async read(id: number, culture: string = 'nl') {
    const r = new sql.Request(this._pool)
    r.input('id', sql.Int, id)
    r.input('culture', sql.VarChar, culture)
    const res = await r.execute(this.schema + 'usp_findLegacyRecipe')

    const {
      error
    } = res.recordset[0]

    if (!error) {
      return {
        error,
        result: res.recordsets[1][0] || []
      }
    }
    return {
      error
    }
  }
}