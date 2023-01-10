import Router from "koa-router"
import { MyContext, MyState } from "../index.js"
import logger from "../log.js"
import SSICert from "../model/SSICert.js"
import User from "../model/User.js"
import VCRequest from "../model/VCRequest.js"

const router = new Router<MyState, MyContext>()

type CreateRequestDTO = {
  requestText: string
  attachedVCs: string[]
  holderEmail: string
  issuerId: number
}

router.post("/request", async ctx => {
  const data = ctx.request.body as CreateRequestDTO
  logger.trace({ data }, "Got request creation request")
  if (data?.requestText != null && data?.attachedVCs != null && data?.holderEmail != null) {
    try {
      const issuerExists = (await ctx.orm.count(User, { id: data.issuerId })) === 1
      if (issuerExists) {
        const vcRequest = new VCRequest(
          data.holderEmail,
          data.requestText,
          ctx.orm.getReference(User, data.issuerId),
          data.attachedVCs.map(vc => SSICert.import(vc)),
        )
        ctx.orm.persist(vcRequest)
        ctx.status = 201
      } else {
        ctx.status = 404
        ctx.body = { error: "Issuer not found" }
      }
    } catch (e) {
      logger.error(e, "Error while creating request")
      ctx.status = 400
      ctx.body = { error: "Bad request" }
    }
  } else {
    ctx.status = 400
    ctx.body = { error: "Bad request" }
  }
})

export default router
