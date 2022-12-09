import Router from "koa-router"
import { MyContext } from "../index"

const router = new Router<{}, MyContext>()

router.get("/", async ctx => {
  ctx.body = "Hello World"
})

export default router
