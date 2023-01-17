import { Migration } from '@mikro-orm/migrations';

export class Migration20230117104618 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" alter column "identity" type bytea using ("identity"::bytea);');

    this.addSql('alter table "vcrequest" alter column "vc" type bytea using ("vc"::bytea);');
  }

  async down(): Promise<void> {
    this.addSql('alter table "user" alter column "identity" type text using ("identity"::text);');

    this.addSql('alter table "vcrequest" alter column "vc" type text using ("vc"::text);');
  }

}
