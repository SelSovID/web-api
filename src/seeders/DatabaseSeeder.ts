import type { EntityManager } from "@mikro-orm/core"
import { Seeder } from "@mikro-orm/seeder"
import User from "../model/User.js"
import { faker } from "@faker-js/faker"

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    em.create(User, await User.create("testpassword"))

    for (let i = 0; i < 10; i++) {
      em.create(User, await User.create(faker.internet.password()))
    }
  }
}
