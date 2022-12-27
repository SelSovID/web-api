import { Type, ValidationError } from "@mikro-orm/core"
import { KeyObject, createPublicKey, createPrivateKey } from "node:crypto"

export class PublicKeyObject extends Type<KeyObject | undefined, Buffer | undefined> {
  convertToDatabaseValue(value: KeyObject | Buffer | undefined): Buffer | undefined {
    if (value instanceof KeyObject) {
      return Buffer.from(value.export({ format: "pem", type: "pkcs1" }))
    } else if (typeof value === "string" || value == null) {
      return value
    } else {
      throw ValidationError.invalidType(PublicKeyObject, value, "JS")
    }
  }

  convertToJSValue(value: Buffer | undefined): KeyObject | undefined {
    try {
      if (value != null) {
        return createPublicKey(value)
      } else {
        return value
      }
    } catch (e) {
      throw ValidationError.invalidType(PublicKeyObject, value, "database")
    }
  }
  getColumnType(): string {
    return "bytea"
  }

  compareAsType(): string {
    return "bytea"
  }
}

export class PrivateKeyObject extends PublicKeyObject {
  convertToJSValue(value: Buffer | undefined): KeyObject | undefined {
    try {
      if (value != null) {
        return createPrivateKey(value)
      } else {
        return value
      }
    } catch (e) {
      throw ValidationError.invalidType(PrivateKeyObject, value, "database")
    }
  }
}
