import { Migration } from '@mikro-orm/migrations';

export class Migration20230113124208 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "vcrequest" alter column "text" type text using ("text"::text);');
  }

  async down(): Promise<void> {
    this.addSql('alter table "vcrequest" alter column "text" type varchar(255) using ("text"::varchar(255));');
  }

}
