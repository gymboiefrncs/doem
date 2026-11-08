import z from "zod";

export const registerWebsiteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  domain: z.string().min(1, "Domain is required"),
  timezone: z
    .string()
    .min(1, "Timezone is required")
    .refine(
      (timezone) => {
        try {
          new Intl.DateTimeFormat("en-US", {
            timeZone: timezone
          });
          return true;
        } catch (error) {
          return false;
        }
      },
      { message: "Invalid timezone" }
    )
});

export const registerWebsiteResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  domain: z.string(),
  timezone: z.string(),
  dashboardAccessToken: z.string(),
  recoveryKey: z.string(),
  createdAt: z.iso.datetime({ offset: true })
});

export type RegisterWebsiteInput = z.infer<typeof registerWebsiteSchema>;
export type RegisterWebsiteResponse = z.infer<typeof registerWebsiteResponseSchema>;
