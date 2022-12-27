import { Migration } from '@mikro-orm/migrations';

export class Migration20221227162627 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "ssicert" ("_id" serial primary key, "parent__id" int null, "public_key" bytea not null, "credential_text" varchar(255) not null, "owner_signature" bytea null, "parent_signature" bytea null);');

    this.addSql('alter table "ssicert" add constraint "ssicert_parent__id_foreign" foreign key ("parent__id") references "ssicert" ("_id") on update cascade on delete set null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "ssicert" drop constraint "ssicert_parent__id_foreign";');

    this.addSql('drop table if exists "ssicert" cascade;');
  }

}
