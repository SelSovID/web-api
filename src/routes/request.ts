import Router from "koa-router"
import { MyContext, MyState } from "../index.js"
import logger from "../log.js"
import SSICert from "../model/SSICert.js"
import VCRequest from "../model/VCRequest.js"

type RequestsDTO = {
  id: number
  fromUser: string | null
  date: number
  requestText: string
}

type RequestDetailsDTO = RequestsDTO & {
  attachedVCs: string[]
}

const mapRequestToDTO = (request: VCRequest): RequestsDTO => ({
  id: request.id,
  fromUser:
    request.attachedVCs
      .getItems()
      .find(vc => vc.credentialText.startsWith("IDENTITY\n\n"))
      ?.credentialText.split("IDENTITY\n\n")[1] ?? null,
  date: request.createdAt.toMillis(),
  requestText: SSICert.import(request.VC).credentialText,
})

const mapRequestDetailsToDTO = (request: VCRequest): RequestDetailsDTO => ({
  ...mapRequestToDTO(request),
  attachedVCs: request.attachedVCs.getItems().map(vc => vc.export()),
})

const router = new Router<MyState, MyContext>()

router.get("/", async ctx => {
  const requests = await ctx.orm.find(VCRequest, { forUser: ctx.state.user, accepted: null })

  ctx.body = requests.map(mapRequestToDTO)
  ctx.status = 200
})

router.get("/:id", async ctx => {
  const requestId = parseInt(ctx.params.id)
  if (!isNaN(requestId)) {
    const request = await ctx.orm.findOne(
      VCRequest,
      { forUser: ctx.state.user, id: requestId },
      { populate: ["attachedVCs"] },
    )
    if (request != null) {
      ctx.body = mapRequestDetailsToDTO(request)
      ctx.status = 200
    } else {
      ctx.status = 404
      ctx.body = { error: "Request not found" }
    }
  } else {
    ctx.status = 400
    ctx.body = { error: "Invalid request id" }
  }
})

type RequestUpdateDTO = {
  accept: boolean
  reason?: string
}

router.put("/:id", async ctx => {
  const requestId = parseInt(ctx.params.id)
  const RequestUpdateDTO = ctx.request.body as RequestUpdateDTO | undefined
  logger.debug({ requestId, RequestUpdateDTO }, "Got request update")
  if (!isNaN(requestId) && RequestUpdateDTO != null) {
    const request = await ctx.orm.findOne(VCRequest, { forUser: ctx.state.user, id: requestId })
    if (request != null) {
      if (request.forUser.id === ctx.state.user.id) {
        request.accepted = RequestUpdateDTO.accept
        if (!RequestUpdateDTO.accept) {
          request.denyReason = RequestUpdateDTO.reason
        }
        if (request.accepted) {
          const parentCert = SSICert.import(ctx.state.user.identity)
          const newCert = SSICert.import(request.VC)
          await parentCert.signSubCertificate(newCert, ctx.state.user.privateKey)
          request.VC = newCert.export()
        }
        ctx.orm.persist(request)
        ctx.status = 200
      } else {
        ctx.status = 403
        ctx.body = { error: "You are not allowed to update this request" }
      }
    } else {
      ctx.status = 404
      ctx.body = { error: "VCRequest not found" }
    }
  } else {
    ctx.status = 400
    ctx.body = { error: "Bad request" }
  }
})

export default router
