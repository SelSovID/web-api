import { Entity, PrimaryKey, Property } from "@mikro-orm/core"
import bcrypt from "bcrypt"
import { KeyObject } from "node:crypto"
import { PrivateKeyObject } from "../util/KeyObjectDB.js"

@Entity()
export default class User {
  @PrimaryKey()
  id!: number

  @Property()
  name!: string

  @Property()
  password!: string

  @Property({ type: "text" })
  identity!: string

  @Property({ type: PrivateKeyObject })
  privateKey!: KeyObject

  static async create(name: string, password: string, identity: string, privateKey: KeyObject): Promise<User> {
    const user = new User()
    user.name = name
    user.password = password
    user.identity = identity

    user.privateKey = privateKey

    return user
  }

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }
}
