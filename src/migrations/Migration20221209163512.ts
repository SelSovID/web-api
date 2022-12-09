import { Migration } from '@mikro-orm/migrations';

export class Migration20221209163512 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "private_key" text not null, add column "public_key" text not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "user" drop column "private_key";');
    this.addSql('alter table "user" drop column "public_key";');
  }

}
