import { Migration } from "@mikro-orm/migrations"

export class Migration20221209102507 extends Migration {
  async up(): Promise<void> {
    this.addSql('create table "user" ("id" serial primary key, "password" varchar(255) not null);')
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "user" cascade;')
  }
}
