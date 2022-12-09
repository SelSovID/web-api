import koa from "koa"
import { createServer } from "http"
import koaBody from "koa-body"
import Router from "koa-router"

const app = new koa()
const router = new Router()

app.use(koaBody())

app.use(async ctx => {
  ctx.body = "Hello World"
})

const server = createServer(app.callback())

server.listen(process.env.PORT ?? 8080)
