import { Context } from "koa"
import Router from "koa-router"
import { MyContext, MyState } from "../index.js"
import { StatusCode } from "status-code-enum"
import User from "../model/User.js"

export const retrieveToken = (ctx: Context): string | null => {
  if (ctx.headers.authorization) {
    if (typeof ctx.headers.authorization === "string") {
      const [type, token] = ctx.headers.authorization.split(" ")
      if (type === "Bearer") {
        return token
      }
    }
    throw new Error("Invalid authorization header")
  } else {
    const possibletoken = ctx.cookies.get("token")
    if (possibletoken != null) {
      return possibletoken
    } else {
      return null
    }
  }
}

const router = new Router<MyState, MyContext>()

router.post("/", async ctx => {
  try {
    const token = retrieveToken(ctx)

    if (token == null) {
      ctx.status = StatusCode.ClientErrorBadRequest
      ctx.body = { error: "Bad request. No token provided." }
    } else {
      const userCount = await ctx.orm.count(User, { password: token })
      const userExists = userCount === 1
      if (userExists) {
        ctx.cookies.set("token", token, {
          httpOnly: true,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production" ? true : false,
        })
        ctx.status = StatusCode.SuccessCreated
      } else {
        ctx.status = StatusCode.ClientErrorUnauthorized
        ctx.body = { error: "Unauthorized" }
      }
    }
  } catch (e) {
    if (e instanceof Error) {
      ctx.body = e.message
      ctx.status = StatusCode.ClientErrorBadRequest
    } else {
      throw e
    }
  }
})

export default router
