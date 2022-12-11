import Router from "koa-router"
import { MyContext } from "../index.js"

const router = new Router<{}, MyContext>()

router.get("/", async ctx => {
  ctx.body = [
    {
      id: 1,
      fromUser: {
        email: "billybob@fmail.com",
      },
      date: Date.now(),
      requestText: "Hallo ik ben billy bob en ik wil graag rijden",
    },
    {
      id: 2,
      fromUser: {
        email: "ShawnTheSheep@godmail.com",
      },
      date: Date.now(),
      requestText: "heel veel geld",
    },
  ]
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
