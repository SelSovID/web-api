import { Type } from "@mikro-orm/core"
import SSICert from "../SSICert.js"
import { exportCert, importCert } from "../SSICertService.js"

export default class DBSSI extends Type<SSICert | undefined, string | undefined> {
  convertToDatabaseValue(value: SSICert | undefined): string | undefined {
    if (value instanceof SSICert) {
      return exportCert(value)
    } else if (value == null) {
      return value
    } else {
      throw new Error("Invalid type")
    }
  }

  convertToJSValue(value: string | undefined): SSICert | undefined {
    if (value != null) {
      return importCert(value)
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
