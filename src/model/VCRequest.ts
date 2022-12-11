import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core"
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

  @Property()
  createdAt = new Date()
}
