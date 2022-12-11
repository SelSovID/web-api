import Router from "koa-router"
import { MyContext } from "../index.js"

const router = new Router<{}, MyContext>()

router.get("/", async ctx => {
  ctx.body = [
    {
      aanvraagID: "1",
      voornaam: "Billy",
      achternaam: "Bob",
      bsn: "123456789",
      aanvraagType: "rijbewijs",
      datum: "08/12/2022",
      tijd: "12:55",
      detail: "Hallo ik ben billy bob en ik wil graag rijden",
    },
    {
      aanvraagID: "2",
      voornaam: "Bob",
      achternaam: "BBilly",
      bsn: "0000000000",
      aanvraagType: "Loonstrook",
      datum: "25/05/2022",
      tijd: "12:57",
      detail: "heel veel geld",
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
