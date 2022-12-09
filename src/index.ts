import koa from "koa"
import { createServer } from "http"
import koaBody from "koa-body"
import Router from "koa-router"
import tokenRouter from "./routes/token"
import requestRouter from "./routes/request"

const app = new koa()
const router = new Router()

app.use(koaBody())

router.use("/token", tokenRouter.routes())
router.use("/request", requestRouter.routes())

app.use(router.routes())

const server = createServer(app.callback())

server.listen(process.env.PORT ?? 8080)
