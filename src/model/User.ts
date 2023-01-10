import { Entity, PrimaryKey, Property } from "@mikro-orm/core"
import bcrypt from "bcrypt"
import crypto, { KeyObject } from "node:crypto"
import { promisify } from "node:util"
import { PrivateKeyObject, PublicKeyObject } from "../util/KeyObjectDB.js"

@Entity()
export default class User {
  @PrimaryKey()
  id!: number

  @Property()
  name!: string

  @Property()
  password!: string

  @Property({ type: PrivateKeyObject })
  privateKey!: KeyObject

  @Property({ type: PublicKeyObject })
  publicKey!: KeyObject

  static async create(name: string, password: string): Promise<User> {
    const user = new User()
    user.password = password
    const pair = await promisify(crypto.generateKeyPair)("rsa", {
      modulusLength: 4096,
    })

    user.privateKey = pair.privateKey
    user.publicKey = pair.publicKey

    return user
  }

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }
}
