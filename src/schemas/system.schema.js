import { z } from 'zod';

export const systemStateSchema = z.object({
  maintenance: z.boolean({
    required_error: "Maintenance state is required",
    invalid_type_error: "Maintenance must be a boolean"
  })
});