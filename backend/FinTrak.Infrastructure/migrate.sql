CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE TABLE "Categories" (
        "Id" uuid NOT NULL,
        "Name" text NOT NULL,
        "IsSystem" boolean NOT NULL,
        CONSTRAINT "PK_Categories" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE TABLE "Goals" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Name" text NOT NULL,
        "TargetAmount" numeric NOT NULL,
        "CurrentAmount" numeric NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "CompletedAt" timestamp with time zone,
        "TargetDate" date,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Goals" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE TABLE "MerchantAliases" (
        "Id" uuid NOT NULL,
        "RawName" text NOT NULL,
        "NormalizedName" text NOT NULL,
        "Source" text NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_MerchantAliases" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE TABLE "PlaidItems" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "PlaidItemId" text NOT NULL,
        "AccessToken" text NOT NULL,
        "InstitutionId" text NOT NULL,
        "InstitutionName" text NOT NULL,
        "TransactionCursor" text,
        "LastSyncedAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        "Status" text NOT NULL,
        "ErrorCode" text,
        CONSTRAINT "PK_PlaidItems" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE TABLE "RefreshTokens" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Token" text NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "RevokedAt" timestamp with time zone,
        "RevokedReason" text,
        CONSTRAINT "PK_RefreshTokens" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE TABLE "Users" (
        "Id" uuid NOT NULL,
        "Name" text NOT NULL,
        "Email" text NOT NULL,
        "GoogleId" text NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "LastSeenAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE TABLE "Bills" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Name" text NOT NULL,
        "Amount" numeric NOT NULL,
        "CategoryId" uuid,
        "Frequency" text NOT NULL,
        "DueDay" integer,
        "CustomDate" date,
        "LastPaidDate" date,
        "IsAutoPay" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Bills" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Bills_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE TABLE "Budgets" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Name" text NOT NULL,
        "Amount" numeric NOT NULL,
        "CategoryId" uuid,
        "Period" text,
        "CreatedAt" timestamp with time zone NOT NULL,
        "StartDate" timestamp with time zone NOT NULL,
        "EndDate" timestamp with time zone,
        "DeletedAt" timestamp with time zone,
        "IsRecurring" boolean NOT NULL,
        "IsActive" boolean NOT NULL,
        "DeletedReason" text,
        CONSTRAINT "PK_Budgets" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Budgets_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE TABLE "Transactions" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "AccountId" uuid NOT NULL,
        "PlaidTransactionId" text NOT NULL,
        "Amount" numeric NOT NULL,
        "MerchantNameRaw" text NOT NULL,
        "MerchantName" text NOT NULL,
        "CategoryId" uuid NOT NULL,
        "Description" text NOT NULL,
        "IsPending" boolean NOT NULL,
        "IsManual" boolean NOT NULL,
        "DedupHash" text NOT NULL,
        "DedupStatus" text NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        "Date" date NOT NULL,
        CONSTRAINT "PK_Transactions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Transactions_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE TABLE "Accounts" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "PlaidItemId" uuid NOT NULL,
        "PlaidAccountId" text NOT NULL,
        "Name" text NOT NULL,
        "OfficialName" text,
        "Mask" text NOT NULL,
        "Type" text NOT NULL,
        "Subtype" text,
        "CurrentBalance" numeric,
        "AvailableBalance" numeric,
        "BalanceLastUpdated" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Accounts" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Accounts_PlaidItems_PlaidItemId" FOREIGN KEY ("PlaidItemId") REFERENCES "PlaidItems" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE TABLE "SyncQueue" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "PlaidItemId" uuid NOT NULL,
        "Status" text NOT NULL,
        "ErrorMessage" text,
        "CreatedAt" timestamp with time zone NOT NULL,
        "StartedAt" timestamp with time zone,
        "CompletedAt" timestamp with time zone,
        CONSTRAINT "PK_SyncQueue" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_SyncQueue_PlaidItems_PlaidItemId" FOREIGN KEY ("PlaidItemId") REFERENCES "PlaidItems" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE UNIQUE INDEX "IX_Accounts_PlaidAccountId" ON "Accounts" ("PlaidAccountId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE INDEX "IX_Accounts_PlaidItemId" ON "Accounts" ("PlaidItemId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE INDEX "IX_Bills_CategoryId" ON "Bills" ("CategoryId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE INDEX "IX_Budgets_CategoryId" ON "Budgets" ("CategoryId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE UNIQUE INDEX "IX_MerchantAliases_RawName" ON "MerchantAliases" ("RawName");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE UNIQUE INDEX "IX_PlaidItems_PlaidItemId" ON "PlaidItems" ("PlaidItemId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE INDEX "IX_SyncQueue_PlaidItemId" ON "SyncQueue" ("PlaidItemId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE INDEX "IX_Transactions_CategoryId" ON "Transactions" ("CategoryId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE INDEX "IX_Transactions_DedupHash" ON "Transactions" ("DedupHash");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE INDEX "IX_Transactions_PlaidTransactionId" ON "Transactions" ("PlaidTransactionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    CREATE UNIQUE INDEX "IX_Users_GoogleId" ON "Users" ("GoogleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509151643_InitialSchema') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260509151643_InitialSchema', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260510131647_MakeTransactionCategoryNullable') THEN
    ALTER TABLE "Transactions" DROP CONSTRAINT "FK_Transactions_Categories_CategoryId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260510131647_MakeTransactionCategoryNullable') THEN
    ALTER TABLE "Transactions" ALTER COLUMN "CategoryId" DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260510131647_MakeTransactionCategoryNullable') THEN
    ALTER TABLE "Transactions" ADD CONSTRAINT "FK_Transactions_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260510131647_MakeTransactionCategoryNullable') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260510131647_MakeTransactionCategoryNullable', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260523144104_AddIsActiveToGoals') THEN
    ALTER TABLE "Goals" ADD "IsActive" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260523144104_AddIsActiveToGoals') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260523144104_AddIsActiveToGoals', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260526201416_AccountsGoalsJoinTableMigration') THEN
    ALTER TABLE "Goals" ALTER COLUMN "TargetAmount" DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260526201416_AccountsGoalsJoinTableMigration') THEN
    CREATE TABLE "AccountGoal" (
        "LinkedAccountsId" uuid NOT NULL,
        "LinkedGoalsId" uuid NOT NULL,
        CONSTRAINT "PK_AccountGoal" PRIMARY KEY ("LinkedAccountsId", "LinkedGoalsId"),
        CONSTRAINT "FK_AccountGoal_Accounts_LinkedAccountsId" FOREIGN KEY ("LinkedAccountsId") REFERENCES "Accounts" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_AccountGoal_Goals_LinkedGoalsId" FOREIGN KEY ("LinkedGoalsId") REFERENCES "Goals" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260526201416_AccountsGoalsJoinTableMigration') THEN
    CREATE INDEX "IX_AccountGoal_LinkedGoalsId" ON "AccountGoal" ("LinkedGoalsId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260526201416_AccountsGoalsJoinTableMigration') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260526201416_AccountsGoalsJoinTableMigration', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260527002410_AccountsGoalsJoinTableMigration2') THEN
    ALTER TABLE "AccountGoal" DROP CONSTRAINT "FK_AccountGoal_Accounts_LinkedAccountsId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260527002410_AccountsGoalsJoinTableMigration2') THEN
    ALTER TABLE "AccountGoal" DROP CONSTRAINT "FK_AccountGoal_Goals_LinkedGoalsId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260527002410_AccountsGoalsJoinTableMigration2') THEN
    ALTER TABLE "AccountGoal" DROP CONSTRAINT "PK_AccountGoal";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260527002410_AccountsGoalsJoinTableMigration2') THEN
    ALTER TABLE "AccountGoal" RENAME TO "GoalAccounts";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260527002410_AccountsGoalsJoinTableMigration2') THEN
    ALTER INDEX "IX_AccountGoal_LinkedGoalsId" RENAME TO "IX_GoalAccounts_LinkedGoalsId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260527002410_AccountsGoalsJoinTableMigration2') THEN
    ALTER TABLE "Goals" ADD "Priority" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260527002410_AccountsGoalsJoinTableMigration2') THEN
    ALTER TABLE "GoalAccounts" ADD CONSTRAINT "PK_GoalAccounts" PRIMARY KEY ("LinkedAccountsId", "LinkedGoalsId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260527002410_AccountsGoalsJoinTableMigration2') THEN
    ALTER TABLE "GoalAccounts" ADD CONSTRAINT "FK_GoalAccounts_Accounts_LinkedAccountsId" FOREIGN KEY ("LinkedAccountsId") REFERENCES "Accounts" ("Id") ON DELETE CASCADE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260527002410_AccountsGoalsJoinTableMigration2') THEN
    ALTER TABLE "GoalAccounts" ADD CONSTRAINT "FK_GoalAccounts_Goals_LinkedGoalsId" FOREIGN KEY ("LinkedGoalsId") REFERENCES "Goals" ("Id") ON DELETE CASCADE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260527002410_AccountsGoalsJoinTableMigration2') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260527002410_AccountsGoalsJoinTableMigration2', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260530001953_SeedSystemCategories') THEN
    ALTER TABLE "Transactions" ALTER COLUMN "PlaidTransactionId" DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260530001953_SeedSystemCategories') THEN
    ALTER TABLE "Transactions" ALTER COLUMN "IsPending" DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260530001953_SeedSystemCategories') THEN
    ALTER TABLE "Transactions" ALTER COLUMN "Date" DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260530001953_SeedSystemCategories') THEN
    ALTER TABLE "Transactions" ALTER COLUMN "Amount" DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260530001953_SeedSystemCategories') THEN
    ALTER TABLE "Categories" ADD "CreatedAt" timestamp with time zone NOT NULL DEFAULT TIMESTAMPTZ '-infinity';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260530001953_SeedSystemCategories') THEN
    ALTER TABLE "Categories" ADD "DeletedAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260530001953_SeedSystemCategories') THEN
    ALTER TABLE "Categories" ADD "IsActive" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260530001953_SeedSystemCategories') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260530001953_SeedSystemCategories', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260530154519_BudgetsDateOnly') THEN
    ALTER TABLE "Budgets" ALTER COLUMN "StartDate" TYPE date;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260530154519_BudgetsDateOnly') THEN
    ALTER TABLE "Budgets" ALTER COLUMN "EndDate" TYPE date;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260530154519_BudgetsDateOnly') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260530154519_BudgetsDateOnly', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260530181107_BudgetStartDateToDateOnly') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260530181107_BudgetStartDateToDateOnly', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602181349_BudgetRecurringDayAddition') THEN
    ALTER TABLE "Budgets" ADD "RecurringDate" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602181349_BudgetRecurringDayAddition') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260602181349_BudgetRecurringDayAddition', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260603132309_BudgetRecurringDayBackgroundService') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260603132309_BudgetRecurringDayBackgroundService', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608101542_TransactionsCategoryDetailed') THEN
    UPDATE "Transactions" SET "IsPending" = FALSE WHERE "IsPending" IS NULL;
    ALTER TABLE "Transactions" ALTER COLUMN "IsPending" SET NOT NULL;
    ALTER TABLE "Transactions" ALTER COLUMN "IsPending" SET DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608101542_TransactionsCategoryDetailed') THEN
    ALTER TABLE "Transactions" ADD "CategoryDetailed" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608101542_TransactionsCategoryDetailed') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260608101542_TransactionsCategoryDetailed', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260615171223_AddMerchantNameNormalized') THEN
    ALTER TABLE "Transactions" ALTER COLUMN "MerchantNameRaw" DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260615171223_AddMerchantNameNormalized') THEN
    ALTER TABLE "Transactions" ADD "MerchantNameNormalized" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260615171223_AddMerchantNameNormalized') THEN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260615171223_AddMerchantNameNormalized') THEN
    CREATE INDEX ix_transactions_merchant_normalized_trgm ON "Transactions" USING GIN ("MerchantNameNormalized" gin_trgm_ops);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260615171223_AddMerchantNameNormalized') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260615171223_AddMerchantNameNormalized', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260625162746_AddInvites') THEN
    CREATE TABLE "Invites" (
        "Id" uuid NOT NULL,
        "Token" uuid NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        "UsedAt" timestamp with time zone,
        "UsedByUserId" uuid,
        CONSTRAINT "PK_Invites" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260625162746_AddInvites') THEN
    CREATE INDEX "IX_Invites_Token" ON "Invites" ("Token");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260625162746_AddInvites') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260625162746_AddInvites', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260627144121_AddCategoryDetailedId') THEN
    ALTER TABLE "Transactions" DROP COLUMN "CategoryDetailed";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260627144121_AddCategoryDetailedId') THEN
    ALTER TABLE "Transactions" ADD "CategoryDetailedId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260627144121_AddCategoryDetailedId') THEN
    ALTER TABLE "Categories" ADD "DetailId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260627144121_AddCategoryDetailedId') THEN
    CREATE INDEX "IX_Transactions_CategoryDetailedId" ON "Transactions" ("CategoryDetailedId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260627144121_AddCategoryDetailedId') THEN
    CREATE INDEX "IX_Categories_DetailId" ON "Categories" ("DetailId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260627144121_AddCategoryDetailedId') THEN
    ALTER TABLE "Categories" ADD CONSTRAINT "FK_Categories_Categories_DetailId" FOREIGN KEY ("DetailId") REFERENCES "Categories" ("Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260627144121_AddCategoryDetailedId') THEN
    ALTER TABLE "Transactions" ADD CONSTRAINT "FK_Transactions_Categories_CategoryDetailedId" FOREIGN KEY ("CategoryDetailedId") REFERENCES "Categories" ("Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260627144121_AddCategoryDetailedId') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260627144121_AddCategoryDetailedId', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260705165133_AddBillStatus') THEN
    ALTER TABLE "Bills" ADD "Status" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260705165133_AddBillStatus') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260705165133_AddBillStatus', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260710150648_LatestChanges') THEN
    UPDATE "Transactions" SET "IsPending" = FALSE WHERE "IsPending" IS NULL;
    ALTER TABLE "Transactions" ALTER COLUMN "IsPending" SET NOT NULL;
    ALTER TABLE "Transactions" ALTER COLUMN "IsPending" SET DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260710150648_LatestChanges') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260710150648_LatestChanges', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715164401_AddUniqueIndexOnCategoryName') THEN
    CREATE UNIQUE INDEX "IX_Categories_Name" ON "Categories" ("Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715164401_AddUniqueIndexOnCategoryName') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260715164401_AddUniqueIndexOnCategoryName', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260720150603_AddDeletedAtToUser') THEN
    ALTER TABLE "Users" ADD "DeletedAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260720150603_AddDeletedAtToUser') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260720150603_AddDeletedAtToUser', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260727191813_AddDisplayNameToBill') THEN
    ALTER TABLE "Bills" ADD "DisplayName" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260727191813_AddDisplayNameToBill') THEN
    UPDATE "Bills" SET "DisplayName" = "Name" WHERE "DisplayName" = '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260727191813_AddDisplayNameToBill') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260727191813_AddDisplayNameToBill', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260829150253_AddRulesEngine') THEN
    ALTER TABLE "Transactions" ADD "IsCategoryLocked" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260829150253_AddRulesEngine') THEN
    ALTER TABLE "Transactions" ADD "IsMerchantNameLocked" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260829150253_AddRulesEngine') THEN
    CREATE TABLE "Rules" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Priority" integer NOT NULL,
        "RuleName" text NOT NULL,
        "IsActive" boolean NOT NULL,
        "Recursive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        "Target" text,
        "Trigger" text,
        "Actions" jsonb,
        "Conditions" jsonb,
        CONSTRAINT "PK_Rules" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260829150253_AddRulesEngine') THEN
    CREATE UNIQUE INDEX "IX_Rules_UserId_Target_Priority" ON "Rules" ("UserId", "Target", "Priority");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260829150253_AddRulesEngine') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260829150253_AddRulesEngine', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005225529_FilterRulePriorityIndex') THEN
    DROP INDEX "IX_Rules_UserId_Target_Priority";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005225529_FilterRulePriorityIndex') THEN
    CREATE UNIQUE INDEX "IX_Rules_UserId_Target_Priority" ON "Rules" ("UserId", "Target", "Priority") WHERE "DeletedAt" IS NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005225529_FilterRulePriorityIndex') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261005225529_FilterRulePriorityIndex', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007142227_AddTransactionExclusions') THEN
    ALTER TABLE "Transactions" ADD "Exclusions" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007142227_AddTransactionExclusions') THEN
    CREATE TABLE "TransactionExclusions" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "TransactionId" uuid NOT NULL,
        "SourceType" text NOT NULL,
        "SourceId" uuid,
        "Flags" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_TransactionExclusions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_TransactionExclusions_Transactions_TransactionId" FOREIGN KEY ("TransactionId") REFERENCES "Transactions" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007142227_AddTransactionExclusions') THEN
    CREATE UNIQUE INDEX "IX_TransactionExclusions_SourceType_SourceId_TransactionId" ON "TransactionExclusions" ("SourceType", "SourceId", "TransactionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007142227_AddTransactionExclusions') THEN
    CREATE INDEX "IX_TransactionExclusions_TransactionId" ON "TransactionExclusions" ("TransactionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007142227_AddTransactionExclusions') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261007142227_AddTransactionExclusions', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007144010_AddRuleKind') THEN
    ALTER TABLE "Rules" ADD "Kind" text NOT NULL DEFAULT 'Action';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007144010_AddRuleKind') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261007144010_AddRuleKind', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012144807_GoalPriorityEnforcement') THEN
        UPDATE "Goals" AS g
        SET "Priority" = r.rn::int
        FROM (
            SELECT "Id",
                ROW_NUMBER() OVER (
                    PARTITION BY "UserId"
                    ORDER BY "Priority", "CreatedAt", "Id"
                ) AS rn
            FROM "Goals"
            WHERE "DeletedAt" IS NULL
        ) AS r
        WHERE g."Id" = r."Id";

    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012144807_GoalPriorityEnforcement') THEN
    CREATE UNIQUE INDEX "IX_Goals_UserId_Priority" ON "Goals" ("UserId", "Priority") WHERE "DeletedAt" IS NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012144807_GoalPriorityEnforcement') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261012144807_GoalPriorityEnforcement', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261015015037_RulePriorityEnforcement') THEN
    DROP INDEX "IX_Rules_UserId_Target_Priority";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261015015037_RulePriorityEnforcement') THEN
    UPDATE "Rules" AS ru
    SET "Priority" = r.rn::int
    FROM (
        SELECT "Id",
            ROW_NUMBER() OVER (
                PARTITION BY "UserId", "Target"
                ORDER BY "Priority", "CreatedAt", "Id"
            ) AS rn
        FROM "Rules"
        WHERE "DeletedAt" IS NULL
    ) AS r
    WHERE ru."Id" = r."Id";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261015015037_RulePriorityEnforcement') THEN
    CREATE UNIQUE INDEX "IX_Rules_UserId_Target_Priority" ON "Rules" ("UserId", "Target", "Priority") WHERE "DeletedAt" IS NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261015015037_RulePriorityEnforcement') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261015015037_RulePriorityEnforcement', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261027140320_FinTrakUIDCookieHash') THEN
    ALTER TABLE "RefreshTokens" ADD "DeviceTokenHash" bytea NOT NULL DEFAULT BYTEA E'\\x';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261027140320_FinTrakUIDCookieHash') THEN
        DELETE FROM "RefreshTokens";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261027140320_FinTrakUIDCookieHash') THEN
    CREATE UNIQUE INDEX "IX_RefreshTokens_DeviceTokenHash" ON "RefreshTokens" ("DeviceTokenHash");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261027140320_FinTrakUIDCookieHash') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261027140320_FinTrakUIDCookieHash', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261102032202_AddSettings') THEN
    CREATE TABLE "Settings" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        "InactivityTimeout" integer NOT NULL,
        "TransactionPageSize" integer NOT NULL,
        "AutoSync" boolean NOT NULL,
        "AutomaticReports" integer NOT NULL,
        "AutoReportsFrequency" integer NOT NULL,
        "AutoReportsMethod" integer NOT NULL,
        "NotificationMethod" integer NOT NULL,
        "NotificationType" integer NOT NULL,
        CONSTRAINT "PK_Settings" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261102032202_AddSettings') THEN
    CREATE UNIQUE INDEX "IX_Settings_UserId" ON "Settings" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261102032202_AddSettings') THEN
        INSERT INTO "Settings" ("Id", "UserId", "CreatedAt", "DeletedAt", "InactivityTimeout", "TransactionPageSize", "AutoSync", "AutomaticReports", "AutoReportsFrequency", "AutoReportsMethod", "NotificationMethod", "NotificationType")
            SELECT gen_random_uuid(), "Id", CURRENT_TIMESTAMP, null, 30, 50, false, 0, 0, 0, 0, 0 FROM "Users";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261102032202_AddSettings') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261102032202_AddSettings', '10.0.4');
    END IF;
END $EF$;
COMMIT;

