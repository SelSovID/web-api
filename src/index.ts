import koa from "koa"
import { createServer } from "http"

const app = new koa()

app.use(async ctx => {
  ctx.body = "Hello World"
})

const server = createServer(app.callback())

server.listen(process.env.PORT ?? 8080)
