/**
 * Earlier technologies that reshaped society, for the "good and the bad"
 * widget. Each one has a good side and a bad side, and a record of
 * how societies adapted to it, so the reader sees the same pattern repeat:
 * real benefits, real harms, and laws and institutions that came later.
 */

import type { Source } from "@/components/widgets/shared/caseTypes";

export interface Side {
  stat?: { value: string; caption: string };
  text: string;
}

export interface Adaptation {
  /** Short bold lead, e.g. "Copyright (1710)". */
  what: string;
  detail: string;
}

export interface Technology {
  id: string;
  label: string;
  era: string;
  good: Side;
  bad: Side;
  adapted: Adaptation[];
  /** One line on how well, or how fast, the adapting worked. */
  verdict: string;
  sources: Source[];
}

export const technologies: Technology[] = [
  {
    id: "printing",
    label: "Printing press",
    era: "1450s",
    good: {
      stat: { value: "60%", caption: "faster growth over the 1500s for European cities that got a press early" },
      text: "Books became cheap. Reading spread, scientists could build on each other's work, and new ideas could reach thousands of people instead of a handful.",
    },
    bad: {
      stat: { value: "100+ years", caption: "of religious wars that followed the Reformation, which printing helped spread" },
      text: "Print spread hatred and panic as easily as knowledge. A witch-hunting manual went through at least 29 editions, and around 45,000 people were executed for witchcraft over three centuries.",
    },
    adapted: [
      { what: "Censorship (it mostly failed)", detail: "Churches and governments tried to license printers and ban books. Forbidden books were printed anyway." },
      { what: "Copyright (1710)", detail: "Britain's Statute of Anne gave authors rights over their work, so writing could pay." },
      { what: "Libel law", detail: "Courts let people sue over false and damaging things printed about them." },
      { what: "A free press", detail: "England let its licensing of printers lapse in 1695, and the US protected freedom of the press in 1791." },
      { what: "Schools", detail: "Mass schooling eventually taught most people to read, and to judge what they read." },
    ],
    verdict: "It took around two centuries to settle on rules that kept most of the good.",
    sources: [
      { label: "Dittmar 2011", url: "https://ideas.repec.org/a/oup/qjecon/v126y2011i3p1133-1172.html" },
      { label: "Atlas Obscura on the Malleus", url: "https://www.atlasobscura.com/articles/witch-hunting-for-dummies-the-15th-century-witchcraft-manual" },
      { label: "England's Licensing Acts", url: "https://www.ebsco.com/research-starters/history/englands-licensing-acts" },
      { label: "IPKat on the Statute of Anne", url: "https://ipkitten.blogspot.com/2020/09/copyright-history-and-unappreciated.html" },
    ],
  },
  {
    id: "factories",
    label: "Factories",
    era: "1780s",
    good: {
      stat: { value: "+123%", caption: "rise in British workers' real wages from 1840 to 1900, once the gains finally reached them" },
      text: "Machines made goods far cheaper, and over time made ordinary people richer than any generation before them.",
    },
    bad: {
      stat: { value: "46% vs 12%", caption: "rise in output per worker vs rise in wages, Britain 1780 to 1840" },
      text: "For two generations the gains went to factory owners. Children worked long shifts in mills, and the new cities were crowded and full of disease.",
    },
    adapted: [
      { what: "Factory Acts (from 1833)", detail: "Britain banned young children from textile mills, limited working hours, and appointed inspectors to check." },
      { what: "Public health (1848)", detail: "Cities were required to build sewers and supply clean water." },
      { what: "Trade unions", detail: "Workers won the right to organise and bargain for a share of the gains." },
      { what: "Schooling for all (1870s)", detail: "Education became compulsory, taking children out of factories and into classrooms." },
    ],
    verdict: "The fixes worked, but only after decades of damage.",
    sources: [{ label: "Allen, Engels' pause", url: "https://www.nuffield.ox.ac.uk/Users/Allen/engelspause.pdf" }],
  },
  {
    id: "cars",
    label: "Cars",
    era: "1900s",
    good: {
      stat: { value: "3.3 trillion", caption: "miles driven on US roads in 2024" },
      text: "People could live, work and travel far more freely, and goods could reach almost anywhere.",
    },
    bad: {
      stat: { value: "1.19 million", caption: "people killed on the world's roads every year" },
      text: "Cars also filled the air with lead from leaded petrol, which cost Americans alive in 2015 an estimated 824 million IQ points between them.",
    },
    adapted: [
      { what: "Licences and rules of the road", detail: "Driving tests, speed limits and drink-driving laws." },
      { what: "Safer cars", detail: "Seatbelt laws, crash testing and airbags. In the US, deaths per mile driven have fallen by about two-thirds since 1975." },
      { what: "Banning leaded petrol", detail: "Country by country, until Algeria used up the world's last stocks in 2021. The UN estimates this prevents over a million early deaths a year." },
    ],
    verdict: "Each fix came after the harm was clear, and road deaths are still far too high.",
    sources: [
      { label: "FHWA", url: "https://www.fhwa.dot.gov/policyinformation/pubs/our_nations_highways_2026/travel.cfm" },
      { label: "WHO", url: "https://www.who.int/news/item/13-12-2023-despite-notable-progress-road-safety-remains-urgent-global-issue" },
      { label: "McFarland et al. 2022", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8931364" },
      { label: "NHTSA", url: "https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/813509" },
      { label: "UNEP via Al Jazeera", url: "https://www.aljazeera.com/news/2021/8/30/un-hails-milestone-as-use-of-leaded-petrol-ended-globally" },
    ],
  },
  {
    id: "chemistry",
    label: "Chemistry",
    era: "1910s",
    good: {
      stat: { value: "~5×", caption: "as much wheat from a fertilised field as from one never fertilised, in an English experiment running since 1843" },
      text: "In 1909, the chemist Fritz Haber worked out how to make fertiliser from the nitrogen in the air. Crops grown with it now feed about half the world's people. Later, chemists invented the refrigerants that made home fridges possible.",
    },
    bad: {
      stat: { value: "~100,000", caption: "deaths from poison gas in the First World War, out of over a million people injured by it" },
      text: "Haber also led Germany's first poison gas attack, at Ypres in 1915, and chemical weapons were used throughout the First World War. Decades later, the chemicals used in fridges and spray cans tore a hole in the ozone layer.",
    },
    adapted: [
      { what: "Banning chemical weapons", detail: "The Geneva Protocol (1925) banned using them, and the Chemical Weapons Convention (1997) banned having them, with inspections. All declared stockpiles were destroyed by 2023, though Syria and Russia have used chemical weapons since." },
      { what: "Saving the ozone layer", detail: "The Montreal Protocol (1987), signed two years after the ozone hole was confirmed, phased out the chemicals causing it. It was the first UN treaty agreed by every country, and the ozone hole should heal by around 2066." },
    ],
    verdict: "Two of the most successful treaties ever, both with a way to check that countries were keeping them.",
    sources: [
      { label: "Rothamsted, Lessons from Broadbalk", url: "https://test.rothamsted.ac.uk/sites/default/files/Download/Lessons_from_Broadbalk_Instructions_11092020.pdf" },
      { label: "Rothamsted guide (1984)", url: "https://era.rothamsted.ac.uk/eradoc/OCR/guide1984-9-18" },
      { label: "Our World in Data on fertiliser", url: "https://ourworldindata.org/how-many-people-does-synthetic-fertilizer-feed" },
      { label: "OPCW", url: "https://www.opcw.org/media-centre/news/2015/03/exhibition-chemical-weapons-wwi-opens-opcw" },
      { label: "WMO on the ozone layer", url: "https://wmo.int/node/20737" },
    ],
  },
  {
    id: "nuclear",
    label: "Nuclear",
    era: "1940s",
    good: {
      stat: { value: "22%", caption: "of the world's low-carbon electricity came from nuclear power in 2024, more than any source except hydropower" },
      text: "Nuclear power is one of the biggest sources of low-carbon electricity, and radiation treats cancer in millions of people.",
    },
    bad: {
      stat: { value: "~70,000", caption: "nuclear warheads in the world at the peak of the Cold War, in the 1980s" },
      text: "Two atomic bombs killed around 200,000 people in Hiroshima and Nagasaki by the end of 1945, and for decades the world lived with the risk of a war that could end civilisation.",
    },
    adapted: [
      { what: "Inspections (1957)", detail: "The International Atomic Energy Agency was set up to check that nuclear power isn't secretly used for weapons." },
      { what: "Test bans (1963)", detail: "Countries agreed to stop testing bombs in the air, where the fallout spread round the world." },
      { what: "Non-Proliferation Treaty (1970)", detail: "In 1963, President Kennedy feared 15 to 25 countries might soon have nuclear weapons. Today there are nine. South Africa built six bombs and then dismantled them." },
      { what: "Arms control", detail: "Treaties between the US and Russia cut the world's stockpile to about 12,000 warheads." },
    ],
    verdict: "The worst has been avoided so far, but the weapons still exist, and the cuts have stalled.",
    sources: [
      { label: "Ember", url: "https://ember-climate.org/topics/nuclear/" },
      { label: "Anadolu on Ember's 2024 review", url: "https://www.aa.com.tr/en/energy/renewable/clean-power-generates-record-409-of-global-electricity-ember/48465" },
      { label: "SIPRI Yearbook 2025 via FAS", url: "https://fas.org/publication/sipri-yearbook-2025/" },
      { label: "Our World in Data", url: "https://archive.ourworldindata.org/20250903-083611/grapher/nuclear-warhead-stockpiles.html" },
      { label: "ICAN", url: "https://www.icanw.org/hiroshima_and_nagasaki_bombings" },
      { label: "Council for a Livable World", url: "https://livableworld.org/jfks-nuclear-proliferation-warnings-up-to-25-countries-with-nuclear-weapons/" },
    ],
  },
  {
    id: "biotech",
    label: "Biotechnology",
    era: "1970s",
    good: {
      stat: { value: "5% → 0.6%", caption: "of young children worldwide chronically infected with hepatitis B, before vaccination and in 2024" },
      text: "Scientists learned to edit DNA. From 1982, insulin for diabetics was made by engineered bacteria. From 1986, the hepatitis B vaccine was made by yeast with an added gene, and many other medicines followed.",
    },
    bad: {
      stat: { value: "30,000+", caption: "people the Soviet Union secretly employed to make biological weapons, after signing a treaty banning them" },
      text: "The same tools that make medicines could make diseases more dangerous.",
    },
    adapted: [
      { what: "Scientists paused themselves (1974–75)", detail: "Researchers called a voluntary pause on some experiments, then met at Asilomar in California to agree safety rules, which the US government adopted." },
      { what: "A weapons ban (1972)", detail: "The Biological Weapons Convention banned biological weapons, but had no inspections, which is how the Soviet programme went undetected until the 1990s." },
      { what: "Screening DNA orders", detail: "Companies that make DNA to order now check requests against lists of dangerous sequences." },
    ],
    verdict: "Scientists acted early, but a ban nobody could check was broken.",
    sources: [
      { label: "WHO on hepatitis B", url: "https://www.who.int/news-room/fact-sheets/detail/hepatitis-b" },
      { label: "CDC on the first recombinant vaccine", url: "https://www.cdc.gov/mmwr/preview/mmwrhtml/00019181.htm" },
      { label: "NLM on Asilomar", url: "https://profiles.nlm.nih.gov/spotlight/ff/feature/rdna" },
      { label: "Biopreparat", url: "https://en.wikipedia.org/wiki/Biopreparat" },
    ],
  },
];
