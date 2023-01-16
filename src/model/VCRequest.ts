import { Cascade, Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property } from "@mikro-orm/core"
import { DateTime } from "luxon"
import LuxonDate from "../util/luxonDateDB.js"
import SSICert from "../SSICert.js"
import User from "./User.js"
import { randomBytes } from "node:crypto"
import DBSSIArray from "../util/SSIArrayDB.js"
import DBSSI from "../util/DBSSI.js"

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

  @Property({ type: DBSSI })
  VC!: SSICert

  @Property({ type: "text" })
  denyReason?: string

  @Property({ type: LuxonDate })
  createdAt = DateTime.now()

  // The references below are stirngs to avoid a circular dependency
  @Property({ type: DBSSIArray })
  attachedVCs!: SSICert[]

  constructor(vc: SSICert, forUser: User, attachedVCs: SSICert[] = []) {
    this.VC = vc
    this.forUser = forUser!
    this.attachedVCs = attachedVCs
  }
}
