import Router from "koa-router"
import { MyContext, MyState } from "../index.js"
import VCRequest from "../model/VCRequest.js"

type RequestDTO = {
  id: number
  fromUser: {
    email: string
  }
  date: number
  requestText: string
}

const router = new Router<MyState, MyContext>()

router.get("/", async ctx => {
  const requests = await ctx.orm.find(VCRequest, { forUser: ctx.state.user })

  ctx.body = requests.map<RequestDTO>(request => ({
    id: request.id,
    fromUser: {
      email: request.fromEmail,
    },
    date: request.createdAt.getTime(),
    requestText: request.text,
  }))
  ctx.status = 200
})

router.post("/", async ctx => {
  ctx.body = "Hello World"
})

router.get("/:id", async ctx => {
  ctx.body = "Hello World"
})

router.put("/:id", async ctx => {
  ctx.body = "Hello World"
})

export default router
