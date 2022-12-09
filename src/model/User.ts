import { Entity, PrimaryKey, Property } from "@mikro-orm/core"
import bcrypt from "bcrypt"

@Entity()
export default class User {
  @PrimaryKey()
  id!: number

  @Property()
  password!: string

  constructor(password: string) {
    this.password = bcrypt.hashSync(password, 10) // IMPROVE: use async
  }
}
