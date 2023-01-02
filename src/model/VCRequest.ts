import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core"
import { DateTime } from "luxon"
import LuxonDate from "../util/luxonDateDB.js"
import User from "./User.js"

@Entity()
export default class VCRequest {
  @PrimaryKey()
  id!: number

  @ManyToOne()
  forUser!: User

  @Property()
  fromEmail!: string

  @Property()
  text!: string

  @Property({ type: LuxonDate })
  createdAt = DateTime.now()

  constructor(fromEmail: string, text: string, forUser: User | null = null) {
    this.fromEmail = fromEmail
    this.text = text
    this.forUser = forUser!
  }
}
