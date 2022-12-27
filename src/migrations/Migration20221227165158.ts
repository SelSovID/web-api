import { Migration } from '@mikro-orm/migrations';

export class Migration20221227165158 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "vcrequest" alter column "created_at" type varchar(30) using ("created_at"::varchar(30));');
  }

  async down(): Promise<void> {
    this.addSql('alter table "vcrequest" alter column "created_at" type timestamptz(0) using ("created_at"::timestamptz(0));');
  }

}
