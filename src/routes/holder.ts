import Router from "koa-router"
import { MyContext, MyState } from "../index.js"
import logger from "../log.js"
import SSICert from "../SSICert.js"
import User from "../model/User.js"
import VCRequest from "../model/VCRequest.js"
import got from "got"
import { readFileSync } from "node:fs"
import { importCert, verifyChain } from "../SSICertService.js"

let rootCert: SSICert

const SSI_ROOT_CERT_PATH = process.env.SSI_ROOT_CERT_PATH
const SSI_ROOT_CERT_URL = process.env.SSI_ROOT_CERT_URL

if (SSI_ROOT_CERT_PATH) {
  logger.info({ path: SSI_ROOT_CERT_PATH }, "Using SSI_ROOT_CERT_PATH")
  rootCert = importCert(readFileSync(SSI_ROOT_CERT_PATH, "utf8"))
} else if (SSI_ROOT_CERT_URL) {
  logger.info({ url: SSI_ROOT_CERT_URL }, "Using SSI_ROOT_CERT_URL")
  rootCert = importCert(await got(SSI_ROOT_CERT_URL).text())
} else {
  throw new Error("SSI_ROOT_CERT_PATH or SSI_ROOT_CERT_URL must be provided")
}

logger.info("Got root cert")

const router = new Router<MyState, MyContext>()

type CreateRequestDTO = {
  vc: string
  attachedVCs: string[]
  issuerId: number
}

router.post("/request", async ctx => {
  const data = ctx.request.body as CreateRequestDTO
  logger.trace({ data }, "Got request creation request")
  if (data?.vc != null && data?.attachedVCs != null) {
    try {
      const issuerExists = (await ctx.orm.count(User, { id: data.issuerId })) === 1
      if (issuerExists) {
        const vc = importCert(data.vc)
        const vcRequest = new VCRequest(
          vc,
          ctx.orm.getReference(User, data.issuerId),
          data.attachedVCs.map(vc => importCert(vc)),
        )
        for (const cert of vcRequest.attachedVCs) {
          if (!verifyChain(cert, [rootCert])) {
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

type RequestRepsonseDTO = {
  accept: boolean
  vc: string | null
}

router.get("/request/:id", async ctx => {
  const request = await ctx.orm.findOne(VCRequest, { retrievalId: ctx.params.id })
  if (request) {
    if (request.accepted != null) {
      ctx.body = {
        accept: request.accepted,
        vc: request.accepted ? request.VC : null,
      } as RequestRepsonseDTO

      ctx.status = 200
    } else {
      ctx.status = 202
    }
  } else {
    ctx.status = 404
    ctx.body = { error: "Request not found" }
  }
})

export default router
