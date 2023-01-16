import { Migration } from '@mikro-orm/migrations';

export class Migration20230116133230 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "vcrequest" add column "retrieval_id" varchar(255) not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "vcrequest" drop column "retrieval_id";');
  }

}
