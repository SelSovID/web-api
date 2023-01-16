import Router from "koa-router"
import { MyContext, MyState } from "../index.js"
import logger from "../log.js"
import SSICert from "../model/SSICert.js"
import User from "../model/User.js"
import VCRequest from "../model/VCRequest.js"
import got from "got"
import { readFileSync } from "node:fs"

let rootCert: SSICert

const SSI_ROOT_CERT_PATH = process.env.SSI_ROOT_CERT_PATH
const SSI_ROOT_CERT_URL = process.env.SSI_ROOT_CERT_URL

if (SSI_ROOT_CERT_PATH) {
  logger.info({ path: SSI_ROOT_CERT_PATH }, "Using SSI_ROOT_CERT_PATH")
  rootCert = SSICert.import(readFileSync(SSI_ROOT_CERT_PATH, "utf8"))
} else if (SSI_ROOT_CERT_URL) {
  logger.info({ url: SSI_ROOT_CERT_URL }, "Using SSI_ROOT_CERT_URL")
  rootCert = SSICert.import(await got(SSI_ROOT_CERT_URL).text())
} else {
  throw new Error("SSI_ROOT_CERT_PATH or SSI_ROOT_CERT_URL must be provided")
}

logger.info("Got root cert")

const router = new Router<MyState, MyContext>()

type CreateRequestDTO = {
  requestText: string
  attachedVCs: string[]
  fromUser: string
  issuerId: number
}

router.post("/request", async ctx => {
  const data = ctx.request.body as CreateRequestDTO
  logger.trace({ data }, "Got request creation request")
  if (data?.requestText != null && data?.attachedVCs != null && data?.fromUser != null) {
    try {
      const issuerExists = (await ctx.orm.count(User, { id: data.issuerId })) === 1
      if (issuerExists) {
        const vcRequest = new VCRequest(
          data.fromUser,
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
        ctx.body = { id: vcRequest.retrievalId }
        ctx.status = 201
      } else {
        ctx.status = 404
        ctx.body = { error: "Issuer not found" }
      }
    } catch (e) {
      logger.error(e, "Error while creating request")
      ctx.status = 400
      ctx.body = { error: "Bad request, error during vc import" }
    }
  } else {
    ctx.status = 400
    ctx.body = { error: "Bad request. Invalid body" }
  }
})

export default router
