import { Migration } from '@mikro-orm/migrations';

export class Migration20230116143435 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "ssicert" drop constraint "ssicert_parent__id_foreign";');

    this.addSql('drop table if exists "ssicert" cascade;');

    this.addSql('alter table "vcrequest" add column "attached_vcs" text not null;');
    this.addSql('alter table "vcrequest" drop column "from_email";');
    this.addSql('alter table "vcrequest" rename column "text" to "vc";');
  }

  async down(): Promise<void> {
    this.addSql('create table "ssicert" ("_id" serial primary key, "parent__id" int null, "for_request_id" int not null, "public_key" bytea not null, "credential_text" text not null, "owner_signature" bytea null, "parent_signature" bytea null);');

    this.addSql('alter table "ssicert" add constraint "ssicert_parent__id_foreign" foreign key ("parent__id") references "ssicert" ("_id") on update cascade on delete set null;');
    this.addSql('alter table "ssicert" add constraint "ssicert_for_request_id_foreign" foreign key ("for_request_id") references "vcrequest" ("id") on update cascade;');

    this.addSql('alter table "vcrequest" add column "from_email" varchar(255) not null, add column "text" text not null;');
    this.addSql('alter table "vcrequest" drop column "vc";');
    this.addSql('alter table "vcrequest" drop column "attached_vcs";');
  }

}
