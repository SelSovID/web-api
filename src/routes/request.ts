import Router from "koa-router"

const router = new Router()

router.get("/", async ctx => {
  ctx.body = "Hello World"
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
