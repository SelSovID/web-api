import Router from "koa-router"
import { MyContext, MyState } from "../index.js"
import logger from "../log.js"
import SSICert from "../model/SSICert.js"
import User from "../model/User.js"
import VCRequest from "../model/VCRequest.js"

type RequestDTO = {
  id: number
  fromUser: {
    email: string
  }
  date: number
  requestText: string
  attachedVCs: string[]
}

const mapRequestToDTO = (request: VCRequest): RequestDTO => ({
  id: request.id,
  fromUser: {
    email: request.fromEmail,
  },
  date: request.createdAt.toMillis(),
  requestText: request.text,
  attachedVCs: request.attachedVCs.getItems().map(vc => vc.export()),
})

const router = new Router<MyState, MyContext>()

router.get("/", async ctx => {
  const requests = await ctx.orm.find(VCRequest, { forUser: ctx.state.user })

  ctx.body = requests.map(mapRequestToDTO)
  ctx.status = 200
})

type CreateRequestDTO = {
  requestText: string
  attachedVCs: string[]
  holderEmail: string
  issuerId: number
}

router.post("/", async ctx => {
  const data = ctx.request.body as CreateRequestDTO
  logger.trace({ data }, "Got request creation request")
  if (data?.requestText != null && data?.attachedVCs != null && data?.holderEmail != null) {
    const vcRequest = new VCRequest(
      data.holderEmail,
      data.requestText,
      ctx.orm.getReference(User, data.issuerId),
      data.attachedVCs.map(vc => SSICert.import(vc)),
    )
    ctx.orm.persist(vcRequest)
    ctx.status = 201
  } else {
    ctx.status = 400
    ctx.body = { error: "Bad request" }
  }
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
      ctx.body = mapRequestToDTO(request)
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
