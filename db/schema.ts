import {sqliteTable,text,integer,index} from "drizzle-orm/sqlite-core";
export const workspaces=sqliteTable("workspaces",{id:text("id").primaryKey(),ownerId:text("owner_id").notNull(),payload:text("payload").notNull(),revision:integer("revision").notNull().default(1),updatedAt:text("updated_at").notNull()});
export const snapshots=sqliteTable("snapshots",{id:text("id").primaryKey(),workspaceId:text("workspace_id").notNull(),payload:text("payload").notNull(),createdAt:text("created_at").notNull()},t=>[index("snapshots_workspace_date").on(t.workspaceId,t.createdAt)]);
