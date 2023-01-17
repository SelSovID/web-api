import { Type } from "@mikro-orm/core"
import SSICert from "../SSICert.js"
import { exportCert, importCert } from "../SSICertService.js"

export default class DBSSI extends Type<SSICert | undefined, Uint8Array | undefined> {
  convertToDatabaseValue(value: SSICert | undefined): Uint8Array | undefined {
    if (value instanceof SSICert) {
      return exportCert(value)
    } else if (value == null) {
      return value
    } else {
      throw new Error("Invalid type")
    }
  }

  convertToJSValue(value: Uint8Array | undefined): SSICert | undefined {
    if (value != null) {
      return importCert(value)
    } else {
      return value
    }
  }
  getColumnType(): string {
    return "bytea"
  }
  compareAsType(): string {
    return "bytea"
  }
}
