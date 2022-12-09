import koa from "koa"
import { createServer } from "http"
import koaBody from "koa-body"
import Router from "koa-router"
import orm from "./orm"
import tokenRouter from "./routes/token"
import requestRouter from "./routes/request"
import { MikroORM } from "@mikro-orm/postgresql"

export interface MyContext {
  orm: MikroORM
}

const app = new koa<{}, MyContext>()
const router = new Router<{}, MyContext>()

app.use(async (ctx, next) => {
  // Add orm to context. Do this in middleware to enable await
  ctx.orm = await orm
  await next()
})

app.use(koaBody())

router.use("/token", tokenRouter.routes())
router.use("/request", requestRouter.routes())

app.use(router.routes())

const server = createServer(app.callback())

server.listen(process.env.PORT ?? 8080)
