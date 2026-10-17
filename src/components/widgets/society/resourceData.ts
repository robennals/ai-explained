/**
 * Electricity and water figures for the AI and Society chapter's cost
 * widgets. Every number is a published estimate with its source; AI items
 * are flagged so the charts can pick them out from the everyday comparisons.
 * Figures are as of the 2026 research pass in
 * docs/plans/society-and-risk-chapters.md.
 */

export interface Bar {
  label: string;
  value: number;
  isAI: boolean;
  /** Shown on hover: what exactly the number measures, and where it is from. */
  note: string;
}

export interface Comparison {
  title: string;
  unit: string;
  bars: Bar[];
  footnote: string;
}

export interface TrendPoint {
  year: number;
  value: number;
  /** A forecast rather than a measurement. */
  projected: boolean;
  /** Low and high ends when the forecast is a range. */
  range?: [number, number];
}

export interface Trend {
  label: string;
  isAI: boolean;
  points: TrendPoint[];
}

export interface TrendChart {
  title: string;
  unit: string;
  series: Trend[];
  footnote: string;
}

export interface Resource {
  id: "electricity" | "water";
  label: string;
  everyday: Comparison;
  world: Comparison;
  overTime: TrendChart;
}

export const electricity: Resource = {
  id: "electricity",
  label: "Electricity",
  everyday: {
    title: "One use",
    unit: "watt-hours",
    bars: [
      { label: "Chat question", value: 0.3, isAI: true, note: "Typical text question to a chatbot, 2025. Google measured 0.24 Wh for Gemini; Epoch AI and OpenAI estimate about 0.3." },
      { label: "AI image", value: 0.6, isAI: true, note: "One 1024×1024 image from an open model, 2025 (MIT Technology Review)." },
      { label: "Reasoning question", value: 3.9, isAI: true, note: "A question to a model that reasons at length before answering (Microsoft Research, 2025)." },
      { label: "Microwave, 1 minute", value: 17, isAI: false, note: "A 1,000-watt microwave running for one minute." },
      { label: "Hour of streaming video", value: 77, isAI: false, note: "International Energy Agency and Carbon Brief estimate, including data centres and networks." },
      { label: "5-second AI video", value: 940, isAI: true, note: "One short clip from an open video model, 2025 (MIT Technology Review). Commercial models may differ." },
      { label: "Mile in a petrol car", value: 1100, isAI: false, note: "Energy in the petrol burned by a 30 mpg car over one mile." },
      { label: "10-minute electric shower", value: 1600, isAI: false, note: "An electric shower uses up to about 160 Wh a minute (Our World in Data)." },
      { label: "Clothes dryer, one load", value: 2150, isAI: false, note: "A typical new electric dryer uses about 2.15 kWh per load, by the US Department of Energy's test method." },
      { label: "Heavy day with a coding agent", value: 3000, isAI: true, note: "One climate scientist's estimate of his own heavy use of an AI coding agent, 2026. Uncertain by about 2× either way." },
      { label: "Average daily commute in an electric car", value: 9000, isAI: false, note: "About 30 miles there and back, roughly the US average of about 15 miles each way (Bureau of Transportation Statistics), at about 0.3 kWh per mile." },
      { label: "Central air conditioning, hot day", value: 24000, isAI: false, note: "A typical 3,000-watt central air conditioner running for 8 hours. Varies a lot with the house and the weather." },
      { label: "A US home for one day", value: 29600, isAI: false, note: "The average American home used 10,791 kWh of electricity in 2022 (US Energy Information Administration), about 29.6 kWh a day." },
    ],
    footnote: "A watt-hour is the energy a 1-watt light bulb uses in an hour, and a kilowatt-hour (kWh), the unit on electricity bills, is 1,000 of them. A chat question is so small its bar barely shows. A short AI video or a heavy day with a coding agent is a real amount of electricity, but still less than drying a few loads of laundry, and a small fraction of what a home uses in a day.",
  },
  world: {
    title: "The whole world, per year",
    unit: "terawatt-hours",
    bars: [
      { label: "Bitcoin mining", value: 138, isAI: false, note: "Cambridge survey, 2025." },
      { label: "AI data centres", value: 155, isAI: true, note: "Data centres built mainly for AI, 2025 (International Energy Agency)." },
      { label: "Electric vehicles", value: 180, isAI: false, note: "All the world's electric cars, buses and trucks, 2024 (International Energy Agency)." },
      { label: "Other data centres", value: 330, isAI: false, note: "All other data centres: websites, streaming, cloud storage, email and so on, 2025 (International Energy Agency)." },
      { label: "Aluminium smelting", value: 900, isAI: false, note: "2023, industry estimate." },
      { label: "Air conditioning and fans", value: 2900, isAI: false, note: "Cooling buildings, 2025 (International Energy Agency)." },
    ],
    footnote: "A terawatt-hour is a billion kilowatt-hours. The world uses about 30,000 terawatt-hours of electricity a year. Data centres of all kinds used about 485 terawatt-hours in 2025, roughly 1.5% of it. That is a small slice, but a fast-growing one, and they are concentrated in a few places: about a fifth of Ireland's electricity and over a quarter of Virginia's.",
  },
  overTime: {
    title: "Over time",
    unit: "terawatt-hours per year",
    series: [
      {
        label: "Other data centres",
        isAI: false,
        points: [
          { year: 2025, value: 330, projected: false },
          // IEA's 2030 forecast for all data centres (945) minus its AI forecast (465).
          { year: 2030, value: 480, projected: true },
        ],
      },
      {
        label: "Electric vehicles",
        isAI: false,
        points: [
          { year: 2024, value: 180, projected: false },
          { year: 2030, value: 780, projected: true },
        ],
      },
      {
        label: "AI data centres",
        isAI: true,
        points: [
          { year: 2025, value: 155, projected: false },
          { year: 2030, value: 465, projected: true },
        ],
      },
    ],
    footnote: "Dashed lines are forecasts by the International Energy Agency. The hard part is not the total but adding new power fast enough: in the US, new power projects wait over four years on average to connect to the grid, and gas turbines are sold out until around 2030.",
  },
};

export const water: Resource = {
  id: "water",
  label: "Water",
  everyday: {
    title: "One use",
    unit: "litres",
    bars: [
      { label: "Chat question (cooling only)", value: 0.00026, isAI: true, note: "Google's measurement for a median Gemini text question, 2025: about five drops." },
      { label: "Chat question (whole life cycle)", value: 0.045, isAI: true, note: "Mistral's estimate for one response, including a share of training the model and making the chips (2025)." },
      { label: "Glass of water", value: 0.25, isAI: false, note: "A 250 ml glass." },
      { label: "Heavy day with a coding agent", value: 3.2, isAI: true, note: "Rough estimate: the coding-agent day's 3 kWh, times the cooling water Google reports per unit of energy (about 1 litre per kWh). Varies a lot between data centres." },
      { label: "Toilet flush", value: 6, isAI: false, note: "A standard modern US toilet uses 1.6 gallons." },
      { label: "Dishwasher load", value: 12, isAI: false, note: "An ENERGY STAR dishwasher uses at most 3.2 gallons per cycle." },
      { label: "5-minute shower", value: 47, isAI: false, note: "At the standard US shower-head flow of 2.5 gallons a minute." },
      { label: "Washing machine load", value: 53, isAI: false, note: "An ENERGY STAR washing machine uses about 14 gallons per load." },
      { label: "One person at home for a day", value: 333, isAI: false, note: "An American uses about 88 gallons of water a day at home (EPA)." },
      { label: "Making a hamburger", value: 2400, isAI: false, note: "Water Footprint Network estimate for a 150 g beef burger. Mostly rain falling on fields that grow cattle feed." },
      { label: "Making a cotton T-shirt", value: 2700, isAI: false, note: "Water Footprint Network estimate, mostly for growing the cotton." },
    ],
    footnote: "The AI bars barely show. The widely shared \"bottle of water per AI email\" came from a model of older AI that also counted water used at power stations.",
  },
  world: {
    title: "The United States, per year",
    unit: "billion gallons",
    bars: [
      { label: "All data centres (cooling on site)", value: 17.4, isAI: true, note: "All US data centres, 2023 (a US government lab)." },
      { label: "All data centres (with power stations)", value: 228, isAI: true, note: "Adds the water used by power stations to make data centres' electricity, 2023 (a US government lab)." },
      { label: "Golf courses", value: 531, isAI: false, note: "Irrigation of US golf courses, 2024 survey." },
      { label: "Growing California's almonds", value: 1010, isAI: false, note: "About a trillion gallons a year (Pacific Institute, 2010 data). Other estimates run from about 0.9 to 1.9 trillion gallons." },
      { label: "Watering home lawns and gardens", value: 2900, isAI: false, note: "US homes use nearly 8 billion gallons a day outdoors, mostly on lawns and gardens (EPA WaterSense)." },
    ],
    footnote: "There is no separate figure for AI, so these bars cover all US data centres. US farm irrigation uses roughly 43,000 billion gallons a year, far too much to fit on this chart. The real problems are local: a data centre in a dry place can matter a great deal to the people who live there.",
  },
  overTime: {
    title: "Over time",
    unit: "billion gallons per year, US data centres, on site",
    series: [
      {
        label: "US data centres",
        isAI: true,
        points: [
          { year: 2014, value: 5.6, projected: false },
          { year: 2023, value: 17.4, projected: false },
          { year: 2028, value: 55, projected: true, range: [38, 73] },
        ],
      },
    ],
    footnote: "The 2028 forecast is a range, from a US government lab. Data centres don't have to evaporate water: newer designs pump it round a sealed loop and never let it evaporate, but then need more electricity for cooling, and power stations use water too.",
  },
};

export const resources: Resource[] = [electricity, water];
