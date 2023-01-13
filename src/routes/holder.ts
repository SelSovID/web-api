import Router from "koa-router"
import { MyContext, MyState } from "../index.js"
import logger from "../log.js"
import SSICert from "../model/SSICert.js"
import User from "../model/User.js"
import VCRequest from "../model/VCRequest.js"
import { readFileSync } from "fs"

const ROOT_CERT_PATH = process.env.ROOT_CERT_PATH
if (ROOT_CERT_PATH == null) {
  throw new Error("ROOT_CERT_PATH not set")
}
const rootCert = SSICert.import(readFileSync(ROOT_CERT_PATH, "utf-8"))

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
        for (const cert of vcRequest.attachedVCs) {
          if (!cert.verifyChain([rootCert])) {
            ctx.status = 404
            ctx.body = { error: "One of your provided verifiable credentials wasn't signed by a recognized root" }
            return
          }
        }
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
