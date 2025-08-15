import { z } from 'zod';

// SiteIndex schemas matching actual structure
export const InternalComponentSchema = z.object({
  type: z.string(),
  name: z.string(),
  contentFile: z.string(),
  showTabsNavigation: z.boolean(),
  cardType: z.enum(['travel', 'testimonial', 'portfolio', 'blog']),
  gridLayout: z.string(),
});

export const SiteIndexSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  component: z.string(),
  isActive: z.boolean(),
  internalComponents: z.array(InternalComponentSchema).optional(),
});

export const SiteIndexSchema = z.object({
  sections: z.array(SiteIndexSectionSchema),
});

// Content schemas - flexible for any section data
export const ContentSchema = z.record(z.unknown());

// Design schemas matching actual structure
export const DesignColorsSchema = z.object({
  primary: z.string(),
  primaryHover: z.string().optional(),
  secondary: z.string().optional(),
  secondaryHover: z.string().optional(),
  text: z.string().optional(),
  textLight: z.string().optional(),
  background: z.string().optional(),
  cardBackground: z.string().optional(),
  pageBackground: z.string().optional(),
  accent: z.string().optional(),
  highlight: z.string().optional(),
  headingColor: z.string().optional(),
}).passthrough();

export const DesignFontsSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
}).passthrough();

export const DesignCardsSchema = z.object({
  container: z.object({
    base: z.string().optional(),
    border: z.string().optional(),
  }).optional(),
}).optional();

export const DesignConfigSchema = z.object({
  colors: DesignColorsSchema,
  fonts: DesignFontsSchema,
  primaryCards: DesignCardsSchema.optional(),
  // Allow any additional design tokens
}).passthrough();

// Settings schemas
export const AgentConfigSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  whatsapp: z.string().optional(),
}).passthrough();

export const SiteSettingsSchema = z.object({
  siteName: z.string().optional(),
  siteDescription: z.string().optional(),
  agentConfig: AgentConfigSchema.optional(),
}).passthrough();

// Validation helper
export const validateData = <T extends z.ZodSchema>(
  data: unknown,
  schema: T,
  contextName: string
): z.infer<T> | null => {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn(`${contextName} validation failed:`, result.error);
    return null;
  }
  return result.data;
};
