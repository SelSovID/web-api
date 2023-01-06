import koa from "koa"
import { createServer } from "http"
import { koaBody } from "koa-body"
import Router from "koa-router"
import orm from "./orm.js"
import tokenRouter, { retrieveToken } from "./routes/token.js"
import requestRouter from "./routes/request.js"
import wsRouter from "./routes/socket.js"
import { EntityManager } from "@mikro-orm/postgresql"
import logger from "./log.js"
import koaLogger from "koa-logger"
import stripAnsi from "strip-ansi"
import User from "./model/User.js"
import { WebSocket } from "ws"
export interface MyContext {
  orm: EntityManager
  ws?: Promise<WebSocket>
}
export interface MyState {
  user: User
}
const app = new koa<{}, MyContext>()

app.proxy = process.env.NODE_ENV === "production"

app.use(async (ctx, next) => {
  // Add orm to context. Do this in middleware to enable await
  ctx.orm = (await orm).em.fork()
  await next()
})

app.use(
  koaLogger({
    transporter(str, args) {
      logger.info({}, stripAnsi(str))
    },
  }),
)

app.use(koaBody())
const router = new Router<MyState, MyContext>()
router.use("/token", tokenRouter.routes())
router.use("/ws", wsRouter.routes())
router.use(async (ctx, next) => {
  const token = retrieveToken(ctx)
  const user = await ctx.orm.findOne(User, { password: token })
  if (!user) {
    ctx.status = 401
    ctx.body = { error: "Invalid token" }
  } else {
    ctx.state.user = user
    await next()
  }
})
router.use("/request", requestRouter.routes())

const prefixRouter = new Router<MyState, MyContext>()
prefixRouter.use("/api", router.routes())
app.use(prefixRouter.routes())

const server = createServer(app.callback())

server.listen(process.env.PORT ?? 8080)
logger.info({ port: process.env.PORT ?? 8080 }, `Listening on port ${process.env.PORT ?? 8080}`)
