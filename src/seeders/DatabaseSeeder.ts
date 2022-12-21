import "dotenv/config"
import type { EntityData, EntityManager } from "@mikro-orm/core"
import { Factory, Seeder } from "@mikro-orm/seeder"
import User from "../model/User.js"
import { Faker, faker } from "@faker-js/faker"
import VCRequest from "../model/VCRequest.js"

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    if (process.env.TEST_PASSWORD != null) {
      const testUser = em.create(User, await User.create(process.env.TEST_PASSWORD))
      new VCRequestFactory(em)
        .each(req => {
          req.forUser = testUser
        })
        .make(10)
    }

    for (let i = 0; i < 10; i++) {
      const user = em.create(User, await User.create(faker.internet.password()))
      new VCRequestFactory(em)
        .each(req => {
          req.forUser = user
        })
        .make(10)
    }
  }
}

class VCRequestFactory extends Factory<VCRequest> {
  model = VCRequest
  protected definition(faker: Faker): EntityData<VCRequest> {
    return new VCRequest(faker.internet.email(), faker.lorem.sentence())
  }
}
