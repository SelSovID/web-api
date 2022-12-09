import { Context } from "koa"
import Router from "koa-router"
import { MyContext } from "../index"
import statusCodes from "status-code-enum"
import User from "../model/User"

export const retrieveToken = (ctx: Context): string | null => {
  if (ctx.headers.authorization) {
    const [type, token] = ctx.headers.authorization.split(" ")
    if (type === "Bearer") {
      return token
    } else {
      throw new Error("Invalid authorization header")
    }
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
  const token = retrieveToken(ctx)

  if (token == null) {
    ctx.status = statusCodes.ClientErrorBadRequest
    ctx.body = "Bad request. No token provided."
  } else {
    const hash = await User.hash(token)

    const userCount = await ctx.orm.count(User, { password: hash })
    const userExists = userCount === 1
    if (userExists) {
      ctx.cookies.set("token", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
      })
      ctx.status = statusCodes.SuccessCreated
    } else {
      ctx.status = statusCodes.ClientErrorUnauthorized
      ctx.body = "Unauthorized"
    }
  }
})

export default router
