import { Migration } from '@mikro-orm/migrations';

export class Migration20221211132305 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "vcrequest" ("id" serial primary key, "from_email" varchar(255) not null, "text" varchar(255) not null, "created_at" timestamptz(0) not null);');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "vcrequest" cascade;');
  }

}
