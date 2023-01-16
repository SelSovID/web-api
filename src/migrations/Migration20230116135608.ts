import { Migration } from '@mikro-orm/migrations';

export class Migration20230116135608 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "identity" text not null;');
    this.addSql('alter table "user" drop column "public_key";');
  }

  async down(): Promise<void> {
    this.addSql('alter table "user" add column "public_key" bytea not null;');
    this.addSql('alter table "user" drop column "identity";');
  }

}
