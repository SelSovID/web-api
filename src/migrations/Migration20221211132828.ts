import { Migration } from '@mikro-orm/migrations';

export class Migration20221211132828 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "vcrequest" add column "for_user_id" int not null;');
    this.addSql('alter table "vcrequest" add constraint "vcrequest_for_user_id_foreign" foreign key ("for_user_id") references "user" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "vcrequest" drop constraint "vcrequest_for_user_id_foreign";');

    this.addSql('alter table "vcrequest" drop column "for_user_id";');
  }

}
