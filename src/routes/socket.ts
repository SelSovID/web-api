import websocket from "koa-easy-ws"
import Router from "koa-router"
import { WebSocket } from "ws"
import { MyState, MyContext } from "../index.js"
import logger from "../log.js"

const router = new Router<MyState, MyContext>()

router.use(websocket("ws"))

const channelListeners: Record<string, WebSocket[]> = {}

type WsMessage = {
  type: "open" | "close" | "message"
  channel: string
  payload?: any
}

router.use(async (ctx, next) => {
  if (ctx.ws) {
    const ws = await ctx.ws
    ws.on("message", message => {
      const data: WsMessage = JSON.parse(message.toString())
      const { channel, type, payload } = data
      if (type === "open") {
        channelListeners[channel] = channelListeners[channel] ?? []
        channelListeners[channel].push(ws)
      } else if (type === "close") {
        for (const sock of channelListeners[channel]) {
          sock.send(JSON.stringify({ type: "close" }))
          sock.close()
        }
        delete channelListeners[channel]
      } else if (type === "message") {
        for (const sock of channelListeners[channel]) {
          if (sock !== ws) {
            sock.send(JSON.stringify({ type: "message", payload }))
          }
        }
      } else {
        logger.error({ data }, "unknown ws message type")
        ws.send(JSON.stringify({ type: "error", payload: "unknown message type" }))
      }
    })
  } else {
    await next()
  }
})
