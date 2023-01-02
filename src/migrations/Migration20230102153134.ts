import { Migration } from '@mikro-orm/migrations';

export class Migration20230102153134 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "ssicert" add column "for_request_id" int not null;');
    this.addSql('alter table "ssicert" add constraint "ssicert_for_request_id_foreign" foreign key ("for_request_id") references "vcrequest" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "ssicert" drop constraint "ssicert_for_request_id_foreign";');

    this.addSql('alter table "ssicert" drop column "for_request_id";');
  }

}
