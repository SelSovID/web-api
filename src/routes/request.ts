import Router from "koa-router"
import { MyContext, MyState } from "../index.js"
import logger from "../log.js"
import VCRequest from "../model/VCRequest.js"

type RequestDTO = {
  id: number
  fromUser: {
    email: string
  }
  date: number
  requestText: string
}

const mapRequestToDTO = (request: VCRequest): RequestDTO => ({
  id: request.id,
  fromUser: {
    email: request.fromEmail,
  },
  date: request.createdAt.getTime(),
  requestText: request.text,
})

const router = new Router<MyState, MyContext>()

router.get("/", async ctx => {
  const requests = await ctx.orm.find(VCRequest, { forUser: ctx.state.user })

  ctx.body = requests.map(mapRequestToDTO)
  ctx.status = 200
})

router.post("/", async ctx => {
  ctx.body = "Hello World"
})

router.get("/:id", async ctx => {
  const requestId = parseInt(ctx.params.id)
  if (!isNaN(requestId)) {
    const request = await ctx.orm.findOne(VCRequest, { forUser: ctx.state.user, id: requestId })
    if (request != null) {
      ctx.body = mapRequestToDTO(request)
      ctx.status = 200
    } else {
      ctx.status = 404
      ctx.body = "Request not found"
    }
  } else {
    ctx.status = 400
    ctx.body = "Invalid request id"
  }
})

type RequestUpdateDTO = {
  accept: boolean
}

router.put("/:id", async ctx => {
  const requestId = parseInt(ctx.params.id)
  const RequestUpdateDTO = ctx.request.body as RequestUpdateDTO
  logger.debug({ requestId, RequestUpdateDTO }, "Got request update")
  if (!isNaN(requestId) || RequestUpdateDTO?.accept == null) {
    const request = await ctx.orm.findOne(VCRequest, { forUser: ctx.state.user, id: requestId })
    if (request != null) {
      // TODO: Implement
    } else {
      ctx.status = 404
      ctx.body = "VCRequest not found"
    }
  } else {
    ctx.status = 400
    ctx.body = "Bad request"
  }
})

export default router
