import { Cascade, Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property } from "@mikro-orm/core"
import { DateTime } from "luxon"
import LuxonDate from "../util/luxonDateDB.js"
import SSICert from "./SSICert.js"
import User from "./User.js"

@Entity()
export default class VCRequest {
  @PrimaryKey()
  id!: number

  @ManyToOne()
  forUser!: User

  @Property()
  fromEmail!: string

  @Property({ type: "text" })
  text!: string

  @Property({ default: null })
  accepted: boolean | null = null

  @Property({ type: "text" })
  denyReason?: string

  @Property({ type: LuxonDate })
  createdAt = DateTime.now()

  // The references below are stirngs to avoid a circular dependency
  @OneToMany({ mappedBy: (cert: SSICert) => cert.forRequest, cascade: [Cascade.ALL] })
  attachedVCs = new Collection<SSICert, this>(this)

  constructor(fromEmail: string, text: string, forUser: User, attachedVCs: SSICert[] = []) {
    this.fromEmail = fromEmail
    this.text = text
    this.forUser = forUser!
    this.attachedVCs = Collection.create(this, "attachedVCs", attachedVCs, false)
  }
}
