ALTER TABLE "messages"
ADD COLUMN "client_id" TEXT;

CREATE UNIQUE INDEX "messages_author_client_id_key"
ON "messages"("author_id", "client_id");
