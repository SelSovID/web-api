import { Migration } from '@mikro-orm/migrations';

export class Migration20230113123615 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "ssicert" alter column "credential_text" type text using ("credential_text"::text);');
  }

  async down(): Promise<void> {
    this.addSql('alter table "ssicert" alter column "credential_text" type varchar(255) using ("credential_text"::varchar(255));');
  }

}
