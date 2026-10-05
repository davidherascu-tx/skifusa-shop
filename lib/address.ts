import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().trim().min(1).max(100),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postal_code: z.string().trim().min(1).max(20),
  country: z.enum(["US", "CA"]),
});

export type Address = z.infer<typeof addressSchema>;

/** Reads the address fields out of a submitted form. */
export const addressFromForm = (f: FormData) =>
  addressSchema.safeParse(Object.fromEntries(["name", "line1", "line2", "city", "state", "postal_code", "country"].map((k) => [k, f.get(k) ?? ""])));
