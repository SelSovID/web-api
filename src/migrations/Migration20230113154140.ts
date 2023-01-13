import { Migration } from "@mikro-orm/migrations"

export class Migration20230113154140 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table "vcrequest" alter column "accepted" drop not null;')
    this.addSql('alter table "vcrequest" alter column "accepted" set default null;')
  }

  async down(): Promise<void> {
    this.addSql('alter table "vcrequest" alter column "accepted" set default false;')
    this.addSql('alter table "vcrequest" alter column "accepted" set not null;')
  }
}
