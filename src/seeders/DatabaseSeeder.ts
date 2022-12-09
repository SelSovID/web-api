import type { EntityManager } from "@mikro-orm/core"
import { Factory, Faker, Seeder } from "@mikro-orm/seeder"
import User from "../model/User.js"

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    em.create(User, new User("testpassword"))

    new UserFactory(em).make(10)
  }
}

class UserFactory extends Factory<User> {
  model = User

  definition(faker: Faker): User {
    return new User(faker.internet.password())
  }
}
