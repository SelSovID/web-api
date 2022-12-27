import { Type, ValidationError } from "@mikro-orm/core"
import { DateTime } from "luxon"

export default class LuxonDate extends Type<DateTime | undefined, string | undefined> {
  convertToDatabaseValue(value: DateTime | string | undefined): string | undefined {
    if (value instanceof DateTime) {
      return value.toISO()
    } else if (typeof value === "string" || value == null) {
      return value
    } else {
      throw ValidationError.invalidType(LuxonDate, value, "JS")
    }
  }

  convertToJSValue(value: string | undefined): DateTime | undefined {
    if (value != null) {
      return DateTime.fromISO(value)
    } else {
      return value
    }
  }
  getColumnType(): string {
    return "varchar(30)"
  }

  compareAsType(): string {
    return "string"
  }
}
