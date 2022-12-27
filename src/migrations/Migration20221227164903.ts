import { Migration } from '@mikro-orm/migrations';

export class Migration20221227164903 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" alter column "private_key" type bytea using ("private_key"::bytea);');
    this.addSql('alter table "user" alter column "public_key" type bytea using ("public_key"::bytea);');
  }

  async down(): Promise<void> {
    this.addSql('alter table "user" alter column "private_key" type text using ("private_key"::text);');
    this.addSql('alter table "user" alter column "public_key" type text using ("public_key"::text);');
  }

}
