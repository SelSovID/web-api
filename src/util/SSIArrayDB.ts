import { Type } from "@mikro-orm/core"
import SSICert from "../SSICert.js"
import { exportCert, importCert } from "../SSICertService.js"

export default class DBSSIArray extends Type<SSICert[] | undefined, string | undefined> {
  convertToDatabaseValue(value: SSICert[] | undefined): string | undefined {
    if (value instanceof Array) {
      return JSON.stringify(value.map(cert => Buffer.from(exportCert(cert)).toString("base64")))
    } else if (value == null) {
      return value
    } else {
      throw new Error("Invalid type")
    }
  }

  convertToJSValue(value: string | undefined): SSICert[] | undefined {
    if (value != null) {
      return JSON.parse(value).map((cert: string) => importCert(Buffer.from(cert, "base64")))
    } else {
      return value
    }
  }
  getColumnType(): string {
    return "text"
  }
  compareAsType(): string {
    return "string"
  }
}
