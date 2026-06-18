import { pgTable, serial, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'Customer' or 'Driver'
  address: text("address"),
  licenseNumber: varchar("license_number", { length: 100 }),
  vehicleType: varchar("vehicle_type", { length: 100 }),
  vehicleRegistration: varchar("vehicle_registration", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});