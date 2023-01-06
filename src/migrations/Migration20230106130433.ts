import { Migration } from '@mikro-orm/migrations';

export class Migration20230106130433 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "vcrequest" add column "deny_reason" text null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "vcrequest" drop column "deny_reason";');
  }

}
