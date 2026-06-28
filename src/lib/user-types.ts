// Client-safe enums for user role and status. Kept free of server-only imports
// (e.g. mongodb) so both server code and Client Components can use the named
// constants instead of magic strings. Each name is both a value (the const
// object) and a type (the union of its values).

export const UserRole = {
  Admin: "admin",
  User: "user",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  Pending: "pending",
  Active: "active",
  Inactive: "inactive",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
