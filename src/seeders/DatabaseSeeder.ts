import "dotenv/config"
import type { EntityManager } from "@mikro-orm/core"
import crypto from "node:crypto"
import { Seeder } from "@mikro-orm/seeder"
import User from "../model/User.js"
import { faker } from "@faker-js/faker"
import VCRequest from "../model/VCRequest.js"
import SSICert from "../model/SSICert.js"
import { promisify } from "node:util"

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    if (process.env.TEST_PASSWORD != null) {
      const testUser = em.create(User, await User.create("Test issuer", process.env.TEST_PASSWORD))
      const reqs = await make(createVCRequest.bind(null, testUser), 10)
      em.persist(reqs)
    }

    for (let i = 0; i < 10; i++) {
      const user = em.create(User, await User.create(faker.name.jobArea(), faker.internet.password()))
      const reqs = await make(createVCRequest.bind(null, user), 10)
      em.persist(reqs)
    }
  }
}

const make = <T>(factory: () => Promise<T> | T, amount: number = 1): Promise<T[]> =>
  Promise.all(new Array(amount).fill(null).map(factory))

async function createVCRequest(user: User): Promise<VCRequest> {
  return new VCRequest(faker.internet.email(), faker.lorem.sentence(), user, await make(createSSICert, 3))
}

/**
 * Creates a self-signed certificate
 * @param request what request to attach the cert to
 * @returns a new SSICert
 */
async function createSSICert(): Promise<SSICert> {
  const { publicKey, privateKey } = await promisify(crypto.generateKeyPair)("rsa", {
    modulusLength: 2048,
    publicExponent: 0x10001,
  })
  return SSICert.create(publicKey, faker.lorem.sentence(), privateKey)
}
