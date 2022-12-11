import Router from "koa-router"
import { MyContext, MyState } from "../index.js"
import VCRequest from "../model/VCRequest.js"

const router = new Router<MyState, MyContext>()

router.get("/", async ctx => {
  const requests = await ctx.orm.find(VCRequest, { forUser: ctx.state.user })

  ctx.body = requests.map(request => ({
    ...request,
    fromUser: { email: request.fromEmail },
    forUser: undefined,
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
