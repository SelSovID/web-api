import { Context } from "koa"
import Router from "koa-router"
import { MyContext } from "../index.js"
import { StatusCode } from "status-code-enum"
import User from "../model/User.js"

export const retrieveToken = (ctx: Context): string | null => {
  if (ctx.headers.authentication) {
    if (typeof ctx.headers.authentication === "string") {
      const [type, token] = ctx.headers.authentication.split(" ")
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

const router = new Router<{}, MyContext>()

router.post("/", async ctx => {
  try {
    const token = retrieveToken(ctx)

    if (token == null) {
      ctx.status = StatusCode.ClientErrorBadRequest
      ctx.body = "Bad request. No token provided."
    } else {
      const userCount = await ctx.orm.count(User, { password: token })
      const userExists = userCount === 1
      if (userExists) {
        ctx.cookies.set("token", token, {
          httpOnly: true,
          sameSite: "strict",
          secure: true,
        })
        ctx.status = StatusCode.SuccessCreated
      } else {
        ctx.status = StatusCode.ClientErrorUnauthorized
        ctx.body = "Unauthorized"
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