import { Migration } from '@mikro-orm/migrations';

export class Migration20230106123721 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "vcrequest" add column "accepted" boolean not null default false;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "vcrequest" drop column "accepted";');
  }

}
