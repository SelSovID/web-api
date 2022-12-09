import { Entity, PrimaryKey, Property, Type } from "@mikro-orm/core"
import bcrypt from "bcrypt"
import crypto, { KeyObject } from "node:crypto"
import { promisify } from "node:util"

export class DBPrivateKey extends Type<KeyObject, string> {
  convertToDatabaseValue(value: KeyObject): string {
    return value.export({ format: "pem", type: "pkcs1" }) as string
  }

  convertToJSValue(value: string): KeyObject {
    return crypto.createPrivateKey(value)
  }

  getColumnType(): string {
    return "text"
  }
}

export class DBPublicKey extends Type<KeyObject, string> {
  convertToDatabaseValue(value: KeyObject): string {
    return value.export({ format: "pem", type: "pkcs1" }) as string
  }

  convertToJSValue(value: string): KeyObject {
    return crypto.createPublicKey(value)
  }

  getColumnType(): string {
    return "text"
  }
}

@Entity()
export default class User {
  @PrimaryKey()
  id!: number

  @Property()
  password!: string

  @Property({ type: DBPrivateKey })
  privateKey!: KeyObject

  @Property({ type: DBPublicKey })
  publicKey!: KeyObject

  static async create(password: string): Promise<User> {
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
