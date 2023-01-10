import Router from "koa-router"
import { MyContext, MyState } from "../index.js"
import logger from "../log.js"
import VCRequest from "../model/VCRequest.js"

type RequestsDTO = {
  id: number
  fromUser: {
    email: string
  }
  date: number
  requestText: string
}

type RequestDetailsDTO = RequestsDTO & {
  attachedVCs: string[]
}

const mapRequestToDTO = (request: VCRequest): RequestsDTO => ({
  id: request.id,
  fromUser: {
    email: request.fromEmail,
  },
  date: request.createdAt.toMillis(),
  requestText: request.text,
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
      request.accepted = RequestUpdateDTO.accept
      if (!RequestUpdateDTO.accept) {
        request.denyReason = RequestUpdateDTO.reason
      }
      ctx.orm.persist(request)
      ctx.status = 200 // Fake succes
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
