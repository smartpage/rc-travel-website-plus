import { z } from 'zod';

// Minimal Zod schema to validate the shape of the design config at runtime.
// This mirrors the existing DesignConfig used in DesignContext but is relaxed to avoid blocking.
const SectionPaddingSchema = z.object({
  mobile: z.string(),
  tablet: z.string(),
  desktop: z.string(),
});

const SectionBackgroundSchema = z.object({
  type: z.enum(['color', 'image']),
  value: z.string(),
  overlay: z
    .object({ color: z.string(), opacity: z.number() })
    .partial()
    .optional(),
});

const SectionInnerLayoutSchema = z.object({
  maxWidth: z.string(),
  margin: z.string().optional(),
  padding: SectionPaddingSchema,
  rounded: z.boolean(),
  borderRadius: z.string().optional(),
  backgroundColor: z.string().nullable().optional(),
  overflow: z.enum(['hidden', 'visible']).optional(),
  background: SectionBackgroundSchema,
});

const SectionLayoutSchema = z.object({
  maxWidth: z.string(),
  minHeight: z.string().optional(),
  height: z.string().optional(),
  backgroundColor: z.string().nullable().optional(),
  padding: SectionPaddingSchema,
  inner: SectionInnerLayoutSchema,
});

const SectionConfigSchema = z.object({
  layout: SectionLayoutSchema,
});

const DesignSchema = z.object({
  colors: z.record(z.string()),
  navigation: z.object({
    menuOverlay: z.record(z.string()),
    hamburger: z.record(z.string()),
  }),
  faq: z.object({
    card: z.record(z.any()),
    arrow: z.record(z.any()),
  }),
  logos: z.object({
    main: z.record(z.string()),
    inverted: z.record(z.string()),
  }),
  buttonStyles: z.any(),
  sections: z.record(SectionConfigSchema),
  fonts: z.record(z.string()),
  primaryCards: z.any(),
  socialIcons: z.any(),
  typography: z.any(),
  travelPackageCard: z.any(),
  cardDefaults: z.any(),
  serviceCard: z.any().optional(),
  hero_headings: z.any().optional(),
  preTitle: z.any().optional(),
  titleDescription: z.any().optional(),
  headings: z.any(),
  buttons: z.any(),
  sliderOptions: z.any(),
  // Profile scaffolding (optional)
  designProfiles: z.record(z.any()).optional(),
  activeDesignProfileId: z.string().optional(),
}).passthrough();

export type DesignData = z.infer<typeof DesignSchema>;

// Load local default design (JSON) for failsafe fallback
// IMPORTANT: We keep a JSON copy so we can delete src/config.ts without losing tokens
import defaultDesign from '@/design-default.json';

// Adapter to load design config from a local json-server instance.
// This isolates I/O from the rest of the app and will later be swapped to Firebase.
export async function fetchDesignFromLocalDB(baseUrl: string = '/design-api'): Promise<DesignData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${baseUrl}/design`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Failed to fetch design: ${res.status}`);
    }
    const json = await res.json();
    const parsed = DesignSchema.safeParse(json);
    if (!parsed.success) {
      console.warn('[designAdapter] Invalid design JSON received, falling back to default');
      return defaultDesign as DesignData;
    }
    return parsed.data;
  } catch (err) {
    clearTimeout(timeout);
    console.warn('[designAdapter] Error fetching design, using default JSON fallback', err);
    return defaultDesign as DesignData;
  }
}


