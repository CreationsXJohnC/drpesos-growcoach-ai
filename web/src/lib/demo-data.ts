import type { CalendarData } from "@/types/grow";

// Pre-generated demo calendar — Hybrid / Coco / Intermediate / LED / 4x4
// Shown to investors and unauthenticated visitors via /demo
// Loads instantly (no API call). Reflects Dr. Pesos signature defoliation schedule.

export const DEMO_CALENDAR: CalendarData & { id: string; name: string } = {
  id: "demo",
  name: "Hybrid / Coco — Demo Grow",
  totalWeeks: 14,
  estimatedHarvestDate: new Date(Date.now() + 14 * 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  weeks: [
    // ── Week 1: Germination ──────────────────────────────────────
    {
      week: 1,
      stage: "germination",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: false,
      drPesosNote:
        "Germination is all about moisture and warmth. Keep your seeds dark, damp, and at 77°F. Don't over-water — just enough to keep the paper towel moist.",
      envTargets: {
        tempF: "75–80°F",
        rh: "70–80%",
        vpd: "0.4–0.6",
        ppfd: "0 (no light yet)",
        lightSchedule: "None (dark)",
      },
      nutrients: "No nutrients during germination. Plain pH'd water at 5.8–6.0 only.",
      dailyTasks: [
        {
          id: "w1-t1",
          task: "Prepare germination station — paper towel method or Rapid Rooters",
          category: "environment",
          priority: "required",
          drPesosNote: "Moisten your medium — damp, not soaking. Squeeze test: a few drops, nothing more.",
        },
        {
          id: "w1-t2",
          task: "Soak seeds in pH 6.0 water for 12–18 hours",
          category: "watering",
          priority: "required",
          drPesosNote: "Seeds that sink are viable. Floaters usually still germinate — give them another 12 hrs.",
        },
        {
          id: "w1-t3",
          task: "Place seeds in paper towel, fold, keep in dark warm spot (77–80°F)",
          category: "environment",
          priority: "required",
        },
        {
          id: "w1-t4",
          task: "Check taproot progress every 12 hours — do not disturb",
          category: "observation",
          priority: "recommended",
          drPesosNote: "Taproots 0.5–1cm = ready to plant. Don't wait for them to get longer — they get fragile.",
        },
        {
          id: "w1-t5",
          task: "Prepare coco medium — pre-buffer with CalMag solution",
          category: "nutrients",
          priority: "required",
          drPesosNote: "Unbuffered coco will steal CalMag from your seedlings. Soak 24hrs in 150ppm CalMag before use.",
        },
      ],
    },
    // ── Week 2: Seedling ────────────────────────────────────────
    {
      week: 2,
      stage: "seedling",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: false,
      drPesosNote:
        "Seedlings are fragile. Your job this week is to keep conditions gentle and consistent. No aggressive feeding — just CalMag and very mild base nutrients.",
      envTargets: {
        tempF: "75–80°F",
        rh: "65–75%",
        vpd: "0.6–0.8",
        ppfd: "200–300 μmol/m²/s",
        lightSchedule: "18/6",
      },
      nutrients:
        "Week 1 seedling feed (coco): CalMag 1.5ml/L + Micro 0.5ml/L + Grow 0.5ml/L. EC 0.4–0.6. pH 5.8–6.0. Water to ~10% runoff once coty leaves fully open.",
      dailyTasks: [
        {
          id: "w2-t1",
          task: "Transplant sprouted seeds into buffered coco, pointed tip down",
          category: "environment",
          priority: "required",
          drPesosNote: "Keep taproot moist but not buried too deep — 0.5cm depth max.",
        },
        {
          id: "w2-t2",
          task: "Set LED to 18/6 schedule, height 24–30\" above canopy",
          category: "environment",
          priority: "required",
        },
        {
          id: "w2-t3",
          task: "Monitor for cotyledon emergence (48–72 hrs after transplant)",
          category: "observation",
          priority: "required",
        },
        {
          id: "w2-t4",
          task: "Water with plain CalMag solution (1.5ml/L) — small amounts, 2x daily",
          category: "watering",
          priority: "required",
          drPesosNote: "In coco, small frequent watering beats large infrequent watering. The medium should never fully dry.",
        },
        {
          id: "w2-t5",
          task: "Check temp/RH twice daily — adjust tent as needed",
          category: "environment",
          priority: "recommended",
        },
      ],
    },
    // ── Week 3: Seedling ────────────────────────────────────────
    {
      week: 3,
      stage: "seedling",
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: false,
      drPesosNote:
        "First true leaves are developing. Increase light intensity slightly and start a mild feed program. Watch for the first set of 5-fingered leaves — that's your transition to veg.",
      envTargets: {
        tempF: "75–80°F",
        rh: "65–70%",
        vpd: "0.7–0.9",
        ppfd: "300–400 μmol/m²/s",
        lightSchedule: "18/6",
      },
      nutrients:
        "Seedling full feed: CalMag 2ml/L + Micro 1ml/L + Grow 1ml/L + Bloom 0.5ml/L. EC 0.8–1.0. pH 5.8–6.0. 2x daily fertigations.",
      dailyTasks: [
        {
          id: "w3-t1",
          task: "Lower LED to 20–22\" above canopy — increase PPFD gradually",
          category: "environment",
          priority: "recommended",
        },
        {
          id: "w3-t2",
          task: "Begin full seedling nutrient program (EC 0.8–1.0)",
          category: "nutrients",
          priority: "required",
          drPesosNote: "In coco you need CalMag every feed — never skip it. Deficiencies happen fast.",
        },
        {
          id: "w3-t3",
          task: "Check for first true leaf sets — note transition to veg when 3+ sets visible",
          category: "observation",
          priority: "recommended",
        },
        {
          id: "w3-t4",
          task: "Check pH runoff — target 5.8–6.2",
          category: "nutrients",
          priority: "required",
        },
        {
          id: "w3-t5",
          task: "Inspect for any early pest activity (fungus gnats, spider mites)",
          category: "ipm",
          priority: "recommended",
          drPesosNote: "Yellow sticky traps in corners — check them twice a week. Early detection = easy treatment.",
        },
      ],
    },
    // ── Week 4: Vegetative ───────────────────────────────────────
    {
      week: 4,
      stage: "vegetative",
      startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: false,
      drPesosNote:
        "You're officially in veg. Push nitrogen, establish your training, and get the canopy spreading wide. This is where you build the plant's framework for flower.",
      envTargets: {
        tempF: "76–82°F",
        rh: "60–70%",
        vpd: "0.8–1.1",
        ppfd: "400–600 μmol/m²/s",
        lightSchedule: "18/6",
      },
      nutrients:
        "Veg feed: CalMag 3ml/L + Micro 2ml/L + Grow 3ml/L + Bloom 1ml/L. EC 1.4–1.8. pH 5.8–6.2. 2–3x daily fertigations targeting 10–15% runoff.",
      dailyTasks: [
        {
          id: "w4-t1",
          task: "Top or FIM your plant above the 4th–5th node",
          category: "training",
          priority: "recommended",
          drPesosNote: "Topping creates two equal main colas and triggers lateral branching. FIM creates 4 — pick your style and commit.",
        },
        {
          id: "w4-t2",
          task: "Begin low-stress training (LST) — tie branches outward toward pot edges",
          category: "training",
          priority: "recommended",
        },
        {
          id: "w4-t3",
          task: "Increase feed EC to 1.4–1.8 range for aggressive veg growth",
          category: "nutrients",
          priority: "required",
        },
        {
          id: "w4-t4",
          task: "Check canopy height — adjust LED to maintain 18–20\" above canopy",
          category: "environment",
          priority: "recommended",
        },
        {
          id: "w4-t5",
          task: "Foliar spray with pH 6.0 water (morning) to maintain humidity",
          category: "environment",
          priority: "optional",
        },
      ],
    },
    // ── Week 5: Vegetative — DEFOLIATION ───────────────────────
    {
      week: 5,
      stage: "vegetative",
      startDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: true,
      drPesosNote:
        "First Dr. Pesos defoliation this week. Remove 20–30% of fan leaves targeting large leaves blocking interior light and any growth below the main canopy. Keep all bud sites.",
      envTargets: {
        tempF: "76–82°F",
        rh: "60–70%",
        vpd: "0.8–1.1",
        ppfd: "500–700 μmol/m²/s",
        lightSchedule: "18/6",
      },
      nutrients:
        "Maintain veg feed: CalMag 3ml/L + Micro 2ml/L + Grow 3ml/L + Bloom 1ml/L. EC 1.6–2.0. Post-defoliation, give 24hrs of plain pH water to reduce stress.",
      dailyTasks: [
        {
          id: "w5-t1",
          task: "Dr. Pesos Defoliation: remove large fan leaves blocking interior bud sites",
          category: "defoliation",
          priority: "required",
          drPesosNote: "Remove no more than 30% at once. Leaves blocking light are targets — healthy exposed leaves stay. Work from bottom up.",
        },
        {
          id: "w5-t2",
          task: "Lollipop lower 1/3 of plant — remove growth that won't receive adequate light",
          category: "defoliation",
          priority: "recommended",
          drPesosNote: "Lower popcorn buds steal energy from top colas. Clean lollipop now = better top yields.",
        },
        {
          id: "w5-t3",
          task: "Post-defoliation: water with pH plain water for 24hrs — no nutrients",
          category: "watering",
          priority: "required",
        },
        {
          id: "w5-t4",
          task: "Continue LST — tie any vertical shoots back outward",
          category: "training",
          priority: "recommended",
        },
        {
          id: "w5-t5",
          task: "Inspect all cut sites for any signs of rot or disease after 48hrs",
          category: "ipm",
          priority: "required",
        },
      ],
    },
    // ── Week 6: Vegetative ───────────────────────────────────────
    {
      week: 6,
      stage: "vegetative",
      startDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: false,
      drPesosNote:
        "Recovery and final push before flip. Your canopy should be filling out with an even, flat profile. Make your last training adjustments now — you won't have much time after flip.",
      envTargets: {
        tempF: "76–82°F",
        rh: "58–65%",
        vpd: "0.9–1.2",
        ppfd: "600–800 μmol/m²/s",
        lightSchedule: "18/6",
      },
      nutrients:
        "Final veg push: CalMag 3ml/L + Micro 2.5ml/L + Grow 3.5ml/L + Bloom 1.5ml/L. EC 1.8–2.2. Begin adding small amounts of Big Bud to start transition.",
      dailyTasks: [
        {
          id: "w6-t1",
          task: "Final canopy training — spread branches to fill entire 4x4 footprint",
          category: "training",
          priority: "recommended",
        },
        {
          id: "w6-t2",
          task: "SCROG net installation if using — pull branches through to even canopy",
          category: "training",
          priority: "optional",
        },
        {
          id: "w6-t3",
          task: "Begin transition nutrients — reduce Grow, add Bloom boosters",
          category: "nutrients",
          priority: "recommended",
          drPesosNote: "A gradual nitrogen reduction now eases the transition stress when you flip to 12/12.",
        },
        {
          id: "w6-t4",
          task: "Deep canopy inspection — look for any males, hermaphrodites, or pests",
          category: "ipm",
          priority: "required",
        },
        {
          id: "w6-t5",
          task: "Document canopy with photo — baseline for flip comparison",
          category: "observation",
          priority: "recommended",
        },
      ],
    },
    // ── Week 7: Early Flower (Flip) ──────────────────────────────
    {
      week: 7,
      stage: "flower",
      startDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 49 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: false,
      drPesosNote:
        "Flip week — change to 12/12 and watch the magic start. Expect stretch to begin in 3–5 days. Pre-stretch is the most critical time to control height. Keep your hands off the leaves for now.",
      envTargets: {
        tempF: "74–80°F",
        rh: "50–60%",
        vpd: "1.0–1.3",
        ppfd: "700–900 μmol/m²/s",
        lightSchedule: "12/12",
      },
      nutrients:
        "Flip transition: CalMag 3ml/L + Micro 2ml/L + Grow 1ml/L + Bloom 3ml/L + Big Bud 2ml/L. EC 1.8–2.2. pH 5.8–6.0. Reduce nitrogen, push phosphorus.",
      dailyTasks: [
        {
          id: "w7-t1",
          task: "Flip light schedule to 12/12 — verify timer is set correctly",
          category: "environment",
          priority: "required",
          drPesosNote: "Check your timer physically. A missed flip or light leak at this stage will stress your plant and can cause hermaphrodites.",
        },
        {
          id: "w7-t2",
          task: "Switch to bloom nutrient formula — reduce Grow, increase Bloom",
          category: "nutrients",
          priority: "required",
        },
        {
          id: "w7-t3",
          task: "Inspect light seals — zero light leaks during 12hr dark period",
          category: "environment",
          priority: "required",
        },
        {
          id: "w7-t4",
          task: "Monitor stretch — train any vertical shoots outward during first 2 weeks of flip",
          category: "training",
          priority: "recommended",
        },
        {
          id: "w7-t5",
          task: "Reduce humidity to 50–60% — begin transitioning environment to flower profile",
          category: "environment",
          priority: "required",
        },
      ],
    },
    // ── Week 8: Early Flower ─────────────────────────────────────
    {
      week: 8,
      stage: "flower",
      startDate: new Date(Date.now() + 49 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: false,
      drPesosNote:
        "Pistils are forming — you'll see white hairs at all bud sites. Pre-flowers are popping. Don't rush the second defoliation yet — let sites establish first.",
      envTargets: {
        tempF: "74–80°F",
        rh: "50–58%",
        vpd: "1.1–1.4",
        ppfd: "800–1000 μmol/m²/s",
        lightSchedule: "12/12",
      },
      nutrients:
        "Early flower: CalMag 3ml/L + Micro 2ml/L + Grow 0.5ml/L + Bloom 4ml/L + Big Bud 3ml/L. EC 1.9–2.3. pH 5.8–6.2. Push P and K, phase out N.",
      dailyTasks: [
        {
          id: "w8-t1",
          task: "Confirm bud site formation at all major nodes",
          category: "observation",
          priority: "required",
        },
        {
          id: "w8-t2",
          task: "Continue managing stretch — tie or supercrop any dominant colas",
          category: "training",
          priority: "recommended",
        },
        {
          id: "w8-t3",
          task: "Increase Bloom feed — target EC 2.0–2.3",
          category: "nutrients",
          priority: "required",
        },
        {
          id: "w8-t4",
          task: "Monitor for early signs of powdery mildew — lower RH if needed",
          category: "ipm",
          priority: "required",
          drPesosNote: "PM loves flower stage. Reduce RH aggressively and increase airflow. Preventative spray with diluted hydrogen peroxide (3%) on leaves.",
        },
        {
          id: "w8-t5",
          task: "Check trellis net or support stakes — colas will need support by week 10",
          category: "environment",
          priority: "recommended",
        },
      ],
    },
    // ── Week 9: Flower — DR. PESOS DEFOLIATION #2 ──────────────
    {
      week: 9,
      stage: "flower",
      startDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: true,
      drPesosNote:
        "Dr. Pesos Defoliation #2 — early flower defoliation. Remove fan leaves blocking bud sites, clear the undercanopy, and open up airflow. This is a light defoliation — be conservative. Bud sites are forming now.",
      envTargets: {
        tempF: "72–78°F",
        rh: "45–55%",
        vpd: "1.2–1.5",
        ppfd: "900–1100 μmol/m²/s",
        lightSchedule: "12/12",
      },
      nutrients:
        "Mid-transition: CalMag 3ml/L + Micro 1.5ml/L + Bloom 5ml/L + Big Bud 4ml/L + Bud Candy 2ml/L. EC 2.0–2.4. pH 5.8–6.2. No grow nutrients.",
      dailyTasks: [
        {
          id: "w9-t1",
          task: "Dr. Pesos Defoliation #2: light defoliation — remove fan leaves blocking bud sites",
          category: "defoliation",
          priority: "required",
          drPesosNote: "Be conservative — remove 20–25% max. Bud sites need leaves nearby for energy. Target leaves blocking direct light to buds, not every fan leaf.",
        },
        {
          id: "w9-t2",
          task: "Remove any yellow or dying leaves (nitrogen senescence is normal now)",
          category: "defoliation",
          priority: "recommended",
          drPesosNote: "Some yellowing of lower leaves is expected — the plant is redirecting nitrogen to bud development. Don't panic unless yellowing is rapid or moves upward.",
        },
        {
          id: "w9-t3",
          task: "Post-defoliation: flush with plain water 24hrs, then resume feed",
          category: "watering",
          priority: "required",
        },
        {
          id: "w9-t4",
          task: "Add Bud Candy / carbohydrate supplement to feed",
          category: "nutrients",
          priority: "recommended",
        },
        {
          id: "w9-t5",
          task: "Stake or trellis colas that are starting to lean",
          category: "environment",
          priority: "recommended",
        },
      ],
    },
    // ── Week 10: Mid Flower ───────────────────────────────────────
    {
      week: 10,
      stage: "flower",
      startDate: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: false,
      drPesosNote:
        "Buds are fattening fast. Trichomes are clear-to-cloudy — harvest is weeks away. Maintain aggressive EC, drop humidity, and watch for botrytis in dense colas.",
      envTargets: {
        tempF: "72–78°F",
        rh: "42–50%",
        vpd: "1.3–1.6",
        ppfd: "900–1100 μmol/m²/s",
        lightSchedule: "12/12",
      },
      nutrients:
        "Peak bloom: CalMag 3ml/L + Micro 1.5ml/L + Bloom 5ml/L + Big Bud 5ml/L + Bud Candy 2ml/L + Overdrive 1ml/L. EC 2.2–2.6. pH 5.8–6.0.",
      dailyTasks: [
        {
          id: "w10-t1",
          task: "Begin trichome monitoring with loupe or scope",
          category: "observation",
          priority: "required",
          drPesosNote: "Clear trichomes = too early. Cloudy = peak THC. Amber = degrading. For most hybrids: harvest at 70% cloudy, 10–20% amber.",
        },
        {
          id: "w10-t2",
          task: "Add Overdrive to feed — switch from Big Bud to late bloom formula",
          category: "nutrients",
          priority: "required",
        },
        {
          id: "w10-t3",
          task: "Reduce RH to 42–50% — increase airflow through canopy",
          category: "environment",
          priority: "required",
          drPesosNote: "Botrytis (bud rot) starts inside dense colas and works outward. Daily inspection of your thickest buds.",
        },
        {
          id: "w10-t4",
          task: "Check and tighten all cola supports — buds are heavy now",
          category: "environment",
          priority: "recommended",
        },
        {
          id: "w10-t5",
          task: "Document trichome stage with macro photography",
          category: "observation",
          priority: "optional",
        },
      ],
    },
    // ── Week 11: Mid Flower — DR. PESOS DEFOLIATION #3 ──────────
    {
      week: 11,
      stage: "flower",
      startDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 77 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: true,
      drPesosNote:
        "Dr. Pesos Defoliation #3 — mid-flower cleanup. Remove remaining fan leaves that are blocking airflow into dense cola sites. This is your last defoliation — light and targeted only.",
      envTargets: {
        tempF: "70–76°F",
        rh: "40–48%",
        vpd: "1.3–1.6",
        ppfd: "900–1100 μmol/m²/s",
        lightSchedule: "12/12",
      },
      nutrients:
        "Late bloom: CalMag 2.5ml/L + Micro 1ml/L + Bloom 4ml/L + Overdrive 3ml/L + Bud Candy 2ml/L. EC 2.0–2.4. Start reducing nitrogen completely.",
      dailyTasks: [
        {
          id: "w11-t1",
          task: "Dr. Pesos Defoliation #3: minimal targeted defoliation — airflow access only",
          category: "defoliation",
          priority: "required",
          drPesosNote: "At this stage the plant needs every leaf it can get for bud energy. Only remove leaves that are directly blocking airflow into dense bud sites or clearly dead.",
        },
        {
          id: "w11-t2",
          task: "Deep inspect all colas for any signs of botrytis or bud rot",
          category: "ipm",
          priority: "required",
          drPesosNote: "Look for discolored or dead hairs inside the cola. Gently spread buds apart and smell — any musty or off smell means rot. Cut affected sections immediately.",
        },
        {
          id: "w11-t3",
          task: "Reduce feed EC to 2.0–2.4 — begin tapering toward flush",
          category: "nutrients",
          priority: "required",
        },
        {
          id: "w11-t4",
          task: "Check trichome color daily — begin harvest countdown",
          category: "observation",
          priority: "required",
        },
        {
          id: "w11-t5",
          task: "Prepare flush solution (plain pH water) for week 13 flush",
          category: "nutrients",
          priority: "optional",
        },
      ],
    },
    // ── Week 12: Late Flower ─────────────────────────────────────
    {
      week: 12,
      stage: "flower",
      startDate: new Date(Date.now() + 77 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: false,
      drPesosNote:
        "Buds are swelling for the final time. Terpenes are peaking — you'll notice the smell intensifying. Trichomes should be mostly cloudy. Flush is coming soon. Don't push nutrients too hard now.",
      envTargets: {
        tempF: "68–75°F",
        rh: "38–45%",
        vpd: "1.4–1.7",
        ppfd: "800–1000 μmol/m²/s",
        lightSchedule: "12/12",
      },
      nutrients:
        "Final feed then flush: Last nutrient feed at EC 1.8–2.0 (Overdrive + Bud Candy only). Then begin 5–7 day flush with plain pH 5.8–6.0 water.",
      dailyTasks: [
        {
          id: "w12-t1",
          task: "Final nutrient feed at reduced EC (1.8–2.0) — Overdrive + CalMag only",
          category: "nutrients",
          priority: "required",
        },
        {
          id: "w12-t2",
          task: "Begin flush: 3x pot volume of plain pH'd water over 5–7 days",
          category: "watering",
          priority: "required",
          drPesosNote: "Flush pulls remaining nutrients from coco, producing a cleaner end product. Test runoff EC — when it drops to 0.4–0.6 you're clear.",
        },
        {
          id: "w12-t3",
          task: "Monitor trichomes daily — target 70% cloudy, 10–20% amber for harvest",
          category: "observation",
          priority: "required",
        },
        {
          id: "w12-t4",
          task: "Temperature drop 5–10°F in final 2 weeks to boost terpene and color production",
          category: "environment",
          priority: "recommended",
          drPesosNote: "Lower night temps (62–65°F) in the last 2 weeks trigger anthocyanin production — purples and blues if the genetics are there.",
        },
        {
          id: "w12-t5",
          task: "Set up drying space — hang lines, check temp 60–65°F / RH 55–60%",
          category: "environment",
          priority: "recommended",
          drPesosNote: "Prepare your drying space before harvest. Ideal dry: slow, dark, 60°F, 60% RH, 10–14 days. Fast drying = hay smell. Patient drying = top-shelf.",
        },
      ],
    },
    // ── Week 13: Harvest / Dry ────────────────────────────────────
    {
      week: 13,
      stage: "harvest",
      startDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 91 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: false,
      drPesosNote:
        "Harvest day. You've made it. Trichomes are cloudy with 10–20% amber. Time to cut, trim, and hang. Do not rush the dry — a slow, patient dry is the difference between average and exceptional.",
      envTargets: {
        tempF: "60–65°F (drying room)",
        rh: "55–60% (drying room)",
        vpd: "N/A",
        ppfd: "0 (darkness for drying)",
        lightSchedule: "Dark (drying)",
      },
      nutrients: "No nutrients. Flush is complete. Plain water only if needed during final 24 hours.",
      dailyTasks: [
        {
          id: "w13-t1",
          task: "Confirm trichome readiness — 70%+ cloudy, 10–20% amber",
          category: "harvest",
          priority: "required",
          drPesosNote: "Use a 60x loupe or digital microscope. Calyx trichomes are the best indicators — bract trichomes mature first and can mislead timing.",
        },
        {
          id: "w13-t2",
          task: "Harvest: cut plants at base, remove large fan leaves immediately",
          category: "harvest",
          priority: "required",
        },
        {
          id: "w13-t3",
          task: "Wet trim: remove remaining leaves, hang whole branches or bucked buds",
          category: "harvest",
          priority: "required",
          drPesosNote: "Wet trimming is faster. Dry trimming preserves terpenes better. I prefer a hybrid — remove sugar leaves while moist, manicure after dry.",
        },
        {
          id: "w13-t4",
          task: "Hang in dark drying room — 60°F, 58% RH, gentle airflow (no fans blowing on buds)",
          category: "harvest",
          priority: "required",
        },
        {
          id: "w13-t5",
          task: "Check daily: stems should bend and snap after 10–14 days",
          category: "observation",
          priority: "required",
          drPesosNote: "The stem snap test: a properly dried stem bends then snaps cleanly. If it bends without snapping — still too moist. If it crumbles — dried too fast.",
        },
      ],
    },
    // ── Week 14: Cure ────────────────────────────────────────────
    {
      week: 14,
      stage: "cure",
      startDate: new Date(Date.now() + 91 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() + 98 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defoliationScheduled: false,
      drPesosNote:
        "The cure separates good weed from great weed. This is where the final terpene and cannabinoid development happens. Patience at this stage is everything. Minimum 2–4 week cure for best results.",
      envTargets: {
        tempF: "60–70°F (storage)",
        rh: "58–65% (inside jars)",
        vpd: "N/A",
        ppfd: "0 (dark storage only)",
        lightSchedule: "Dark (cure)",
      },
      nutrients: "No nutrients. The grow is done. Now we cure.",
      dailyTasks: [
        {
          id: "w14-t1",
          task: "Final trim: manicure and remove remaining sugar leaves",
          category: "harvest",
          priority: "required",
        },
        {
          id: "w14-t2",
          task: "Pack into wide-mouth mason jars — fill 75% full maximum",
          category: "harvest",
          priority: "required",
          drPesosNote: "Overpacking prevents airflow and causes sweating. 75% full leaves room for gas exchange during burping.",
        },
        {
          id: "w14-t3",
          task: "Burp jars 2–3x daily for first week — 15 minutes per session",
          category: "harvest",
          priority: "required",
          drPesosNote: "Burping releases CO2 and moisture built up by the cure process. After week 1 drop to once daily. After 2 weeks — once every 2–3 days.",
        },
        {
          id: "w14-t4",
          task: "Add Boveda 62% humidity packs to each jar after first week",
          category: "environment",
          priority: "recommended",
          drPesosNote: "Boveda packs maintain ideal cure humidity passively. They'll extend cure shelf life significantly — your terpene profile will thank you.",
        },
        {
          id: "w14-t5",
          task: "Store in cool, dark location — minimum 2–4 more weeks for peak quality",
          category: "observation",
          priority: "required",
          drPesosNote: "2 weeks = good. 4 weeks = great. 8 weeks = exceptional. Top-shelf flower requires a real cure. If you rushed this far, don't rush here.",
        },
      ],
    },
  ],
};
