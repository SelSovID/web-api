import koa from "koa"
import { createServer } from "http"
import { koaBody } from "koa-body"
import Router from "koa-router"
import orm from "./orm.js"
import tokenRouter from "./routes/token.js"
import requestRouter from "./routes/request.js"
import { EntityManager } from "@mikro-orm/postgresql"
import logger from "./log.js"
import koaLogger from "koa-logger"
import stripAnsi from "strip-ansi"
export interface MyContext {
  orm: EntityManager
}

const app = new koa<{}, MyContext>()
const router = new Router<{}, MyContext>()
app.use(async (ctx, next) => {
  // Add orm to context. Do this in middleware to enable await
  ctx.orm = (await orm).em
  await next()
})

app.use(
  koaLogger({
    transporter(str, args) {
      logger.info(args, stripAnsi(str))
    },
  }),
)

app.use(koaBody())

router.use("/token", tokenRouter.routes())
router.use("/request", requestRouter.routes())

app.use(router.routes())

const server = createServer(app.callback())

server.listen(process.env.PORT ?? 8080)
logger.info({ port: process.env.PORT ?? 8080 }, `Listening on port ${process.env.PORT ?? 8080}`)
