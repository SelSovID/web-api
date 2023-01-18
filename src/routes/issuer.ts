import Router from "koa-router"
import { MyState, MyContext } from "../index.js"
import logger from "../log.js"
import User from "../model/User.js"

const router = new Router<MyState, MyContext>()

type IssuerDTO = {
  id: number
  name: string
}

const mapIssuerToDTO = (issuer: User): IssuerDTO => ({ id: issuer.id, name: issuer.name })

router.get("/", async ctx => {
  const issuers = await ctx.orm.find(User, {})
  ctx.body = issuers.map(mapIssuerToDTO)
  ctx.status = 200
  logger.trace("Got issuers")
})

export default router
