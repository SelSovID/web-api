import { Entity, PrimaryKey, Property } from "@mikro-orm/core"

@Entity()
export default class VCRequest {
  @PrimaryKey()
  id!: number

  @Property()
  fromEmail!: string

  @Property()
  text!: string

  @Property()
  createdAt = new Date()
}
