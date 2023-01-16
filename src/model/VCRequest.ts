import { Cascade, Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property } from "@mikro-orm/core"
import { DateTime } from "luxon"
import LuxonDate from "../util/luxonDateDB.js"
import SSICert from "./SSICert.js"
import User from "./User.js"
import { randomBytes } from "node:crypto"

@Entity()
export default class VCRequest {
  @PrimaryKey()
  id!: number

  @ManyToOne()
  forUser!: User

  @Property()
  retrievalId: string = randomBytes(64).toString("base64url")

  @Property({ default: null })
  accepted: boolean | null = null

  @Property()
  VC!: string

  @Property({ type: "text" })
  denyReason?: string

  @Property({ type: LuxonDate })
  createdAt = DateTime.now()

  // The references below are stirngs to avoid a circular dependency
  @OneToMany({ mappedBy: (cert: SSICert) => cert.forRequest, cascade: [Cascade.ALL] })
  attachedVCs = new Collection<SSICert, this>(this)

  constructor(vc: SSICert, forUser: User, attachedVCs: SSICert[] = []) {
    this.VC = vc.export()
    this.forUser = forUser!
    this.attachedVCs = Collection.create(this, "attachedVCs", attachedVCs, false)
  }
}
