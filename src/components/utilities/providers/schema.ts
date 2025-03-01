
import * as z from "zod";
import { UtilityType } from "./types";

/**
 * Form validation schema for utility provider management
 */
export const formSchema = z.object({
  provider_name: z.string().min(1, "Provider name is required"),
  custom_provider_name: z.string().optional(),
  property_id: z.string().min(1, "Property is required"),
  utility_type: z.enum(["electricity", "water", "gas", "internet", "building maintenance"] as const),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  location_name: z.string().optional(),
  start_day: z.coerce.number().int().min(1).max(31).optional(),
  end_day: z.coerce.number().int().min(1).max(31).optional(),
})
.refine(
  (data) => {
    // Skip validation if either value is missing
    if (data.start_day === undefined || data.end_day === undefined) {
      return true;
    }
    return data.start_day < data.end_day;
  },
  {
    message: "Start day must be before end day",
    path: ["end_day"], // Show error on the end day field
  }
);

export type FormData = z.infer<typeof formSchema>;
