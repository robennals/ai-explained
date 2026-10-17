# AI and Society / Catastrophic Risk chapters — plan and sources

Status: first draft, with every widget built, marked `ready` so it can be read on the site.
Date: 2026-10-15

## Summary

- **Two chapters, placed straight after Agents.** They are the next chapters after the published ones (ids 14 and 15), and they come before Alignment, which will cover how to fix the problems they raise.
  - `society` (**AI and Society**) is about how AI reshapes everyday society.
  - `risk` (**Catastrophic Risk**) is about routes to catastrophe.
  - Everything after them shifts up by two ids, with `prerequisites` remapped to match.
- **Both chapters are marked `ready`.** They are a fifth part of the home page's learning path, "AI in the world", each with its own looping card illustration (`SocietyArt`, `RiskArt`).
- **Each chapter ends with a quiz, and neither has a notebook.** Both are policy and society topics with no PyTorch content, so a notebook may never make sense. The quiz questions test understanding through new scenarios, not memory of the chapter's examples.
- **Fact-check markers.** Facts that still need a primary-source check are marked with `{/* VERIFY: ... */}` comments in the MDX.

## Structure

### AI and Society (`society`)

**The text is a skimmable overview of about 1,500 words.** Real-world examples live in tabbed widgets, one tab per example, built with `CaseTabs` from data in `src/components/widgets/society/societyCases.ts`. The chapter has no separate playgrounds beyond these widgets.

| Section | Built widget (tabs) |
|---|---|
| Good Technologies Come With Harms | `HistoryWidget` (`TechnologyTabs`, data in `technologies.ts`): printing press, factories, cars, chemistry, nuclear, biotechnology. Each tab shows the good and the bad side by side, then how societies adapted, then a one-line verdict |
| Mistakes and Bias | `BiasWidget`: three tabs (mistakes, biased mistakes, disallowed discrimination), each with collapsible case studies and a "how to correct it" box |
| How Society Decides What's True | `TruthWidget`: flattery, persuasion, a better source?, who's in control, sameness, fakes |
| The Value of Human Thinking | `ValueWidget`: learning, jobs, bargaining power, concentrated power, meaning |
| The Cost in Electricity and Water | `EnergyAndWaterWidget` (Electricity and Water tabs: one use, world, over time) |

The chart figures are in `src/components/widgets/society/resourceData.ts`, each with a note saying what it measures.

### Catastrophic Risk (`risk`)

**Structured as a short overview per section, with case studies in collapsible tabbed widgets** (shared `CaseTabs`, data in `src/components/widgets/risk/riskCases.ts`). Each tab ends with a "What helps" box, and the closing section groups those fixes.

| Section | Built widget |
|---|---|
| An Old Fear | `FictionWidget`: stories (R.U.R., 2001, Colossus, Terminator, Matrix) and early warnings (Turing 1951, I. J. Good 1965) |
| How Seriously People Take It | `EstimatesWidget`: published estimates from 2023 on (earlier ones predate recent progress): Christiano, Amodei, Bengio, Hinton, Musk, the AI Impacts survey, Hassabis and LeCun, on one 0–50% scale. The text explains what "10%" means and that warnings can prevent what they warn about |
| It's Not Today's AI People Are Worried About | `TrajectoryWidget`: steps year by year from 2022 to today, covering chatbots, agents, self-driving cars, robots, factories and weapons, then one clearly marked imagined future, with a diagram of how much of the world the AI can act on |
| Why AI Might Do Bad Things | `WhyBadWidget`: told to by a person (biology, cyberattacks, open models, an AI-enabled power grab), mistakes at scale (Replit database, 2010 flash crash), doing what it was told (boat race, o3, the Hugging Face incident), learning to want power (the AI 2027 and If Anyone Builds It takeover scenarios, instrumental convergence, Scott Alexander's routes, Anthropic's spreading-bad-habits finding), human disempowerment (gradual disempowerment, Christiano's "whimper"). Then `WriteTheRewardWidget`: the reader picks a cleaning robot's reward and an exact planner (`rewardPlanner.ts`) finds the loopholes |
| The Hugging Face Incident | `HuggingFaceWidget`: a high-level, step-by-step walkthrough (isolated, finding each other, breaking out, organising, attacking, caught), each with a diagram |
| Could We Stop It? | `ControlWidget`: deceiving us, avoiding shutdown, copying itself, defending itself |
| What We Can Do | `ResponseWidget`: built on Amodei's three-step pacing plan and the Pacing the Frontier statement, with AI 2040's Plan A for the international step. Tabs: outside checks (embedded evaluators, FRONTIER Act, AI Incident Reporting Act, California/New York/EU laws), companies agreeing (CATS Act, company safety policies), countries agreeing (AI 2040, chip tracking bills, agreements so far), keeping control (AI Kill Switch Act, Stop Rogue AI Act) |

## Decisions made in this draft (for review)

1. **No culture-war examples.**
   - All Grok incidents are left out, as is the US executive order on "woke AI".
   - The study showing models preferring female CVs is left out.
   - "Who decides what it says" now makes the structural point: system prompts and post-training let one company change what hundreds of millions of people hear, and China's rules are the one example.
2. **Gemini images** stay under bias as "when fixing bias backfires", but are described neutrally, without the historical examples that became a political flashpoint. This is the item most likely to need dropping under the no-culture-war rule.
3. **Environment is its own trade-off section**, not part of "mistakes".
4. **Coups and concentration of power are in Society, not Risk.** Risk refers back to the work/power argument for the gradual-disempowerment story.
5. **Placement.** These chapters go straight after the last published chapter, Agents. Unwritten chapters are ignored when deciding the order.
6. **Bio and chem are kept at the level of "what the evidence says about uplift", never method.**
7. **Ending.** Risk ends by pointing at Alignment rather than surveying fixes. The two exceptions are the Forethought coup safeguards and Glasswing, which are included because they explain the risk.
8. **The risk chapter is titled "Catastrophic Risk"**, subtitled "Could AI go badly wrong?". The Society chapter also covers risks such as bias and fakes, so "AI Risk" blurred the line between the two. The URL stays `/risk`.
9. **No "Whatever You Want" playground.** It was planned to show an agent with any goal grabbing resources and blocking its off switch. Write the Reward already shows the off switch being blocked, and the "learning to want power" tab covers the idea in words, so the second playground was dropped.
10. **One widget for the routes to harm.** "What Counts as a Catastrophe" used to have its own tabs (AI helps bad people, misaligned AI, slowly losing control), which largely repeated "Why AI Might Do Bad Things". Its unique cases (the power grab, the two takeover scenarios and the slowly-losing-control tab, now called "Human disempowerment") moved into `WhyBadWidget`. The section itself is gone, and its definition of a catastrophe is now a sentence in "How Seriously People Take It", straight after the extinction statement that names the same scale.

## Sources by section

Confidence: unmarked = checked against a primary or reliable source during research. **(M)** = secondary coverage only.

### History and coordination
- Dittmar 2011, printing and city growth: https://ideas.repec.org/a/oup/qjecon/v126y2011i3p1133-1172.html
- Rubin 2014, printing and Protestantism: https://digitalcommons.chapman.edu/economics_articles/99
- Malleus and the spread of witch trials: https://www.atlasobscura.com/articles/witch-hunting-for-dummies-the-15th-century-witchcraft-manual ; Doten-Snitker et al. 2024 via https://studyfinds.com/printing-presses-fueled-misinformation-witch-hunts-europe/ (M)
- Allen, Engels' pause: https://www.nuffield.ox.ac.uk/Users/Allen/engelspause.pdf
- Phaedrus quote: https://benschmidt.org/Handouts__Phaedrus.html
- Radio 1931 quote: https://www.smithsonianmag.com/history/american-children-faced-great-dangers-1930s-none-greater-little-orphan-annie-180957544/
- Wertham, falsified comic-book data: https://www.printmag.com/print-design-articles/1950s-comics/
- Lead and lost IQ points (McFarland 2022): https://pmc.ncbi.nlm.nih.gov/articles/PMC8931364
- End of leaded petrol (UNEP): https://www.aljazeera.com/news/2021/8/30/un-hails-milestone-as-use-of-leaded-petrol-ended-globally
- Montreal Protocol and ozone recovery: https://wmo.int/node/20737
- JFK's 1963 proliferation prediction: https://livableworld.org/jfks-nuclear-proliferation-warnings-up-to-25-countries-with-nuclear-weapons/
- South Africa giving up its weapons: https://www.npr.org/sections/parallels/2017/05/08/526078459/giving-up-nuclear-weapons-its-rare-but-its-happened
- Biopreparat: https://en.wikipedia.org/wiki/Biopreparat

### Bias, imitation, sycophancy
- Google Photos "gorillas" (2015): https://irishtimes.com/business/technology/google-appalled-as-photos-app-labels-black-people-gorillas-1.2272205 ; Wired 2018 follow-up via https://www.diyphotography.net/fixed-google-removes-gorilla-label-racist-algorithm/ ; NYT May 2023 follow-up (from memory, needs checking). That no other photo reproduced it is the author's first-hand account.
- Amazon hiring tool: https://www.euronews.com/2018/10/10/amazon-scraps-secret-ai-recruiting-tool-that-showed-bias-against-women
- Obermeyer healthcare algorithm: https://www.chicagobooth.edu/review/2019/october/how-racial-bias-infected-major-health-care-algorithm
- COMPAS: https://www.propublica.org/article/how-we-analyzed-the-compas-recidivism-algorithm
- Dialect prejudice (Hofmann, Nature 2024): https://news.uchicago.edu/story/ai-biased-against-speakers-african-american-english-study-finds
- Gemini images: https://blog.google/products/gemini/gemini-image-generation-issue/
- Tay: https://techcrunch.com/2016/03/25/microsoft-apologizes-for-hijacked-chatbot-tays-wildly-inappropriate-tweets/
- Matplotlib agent hit piece: https://the-decoder.com/developer-targeted-by-ai-hit-piece-warns-society-cannot-handle-ai-agents-that-decouple-actions-from-consequences/
- GPT-4o sycophancy postmortem: https://openai.com/index/expanding-on-sycophancy/ (wording via secondary quotes; page returned 403)
- Cheng et al., *Science* 2026: https://techcrunch.com/2026/03/28/stanford-study-outlines-dangers-of-asking-ai-chatbots-for-personal-advice/
- Allan Brooks case: https://flowingdata.com/2025/08/13/man-convinced-of-genius-by-chatbot/
- OpenAI sensitive-conversation figures: https://decrypt.co/346513/openai-reveals-1-million-chatgpt-users-discuss-suicide-weekly (M)

### Education
- Bastani et al., PNAS 2025: https://knowledge.wharton.upenn.edu/article/without-guardrails-generative-ai-can-harm-learning/
- Kestin et al. 2025 (Harvard physics tutor): https://pmc.ncbi.nlm.nih.gov/articles/PMC12179260/
- World Bank pilot in Nigeria: https://blogs.worldbank.org/en/education/From-chalkboards-to-chatbots-Transforming-learning-in-Nigeria
- HEPI 2026 student survey: https://www.hepi.ac.uk/reports/student-generative-ai-survey-2026/

### Energy and water
- Google Gemini per-prompt figures: https://www.datacenterdynamics.com/en/news/google-median-gemini-prompt-uses-024-watt-hours-of-power-and-consumes-026ml-of-water/
- Epoch AI per-query estimate: https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use
- Microsoft Research per-query estimates: https://arxiv.org/pdf/2509.20241
- MIT Technology Review image and video figures: https://simonwillison.net/2025/May/20/ai-energy-footprint/ (M)
- Hausfather on agent energy use: https://www.theclimatebrink.com/p/the-real-energy-use-of-agentic-ai
- IEA totals: https://www.iea.org/reports/energy-and-ai/executive-summary ; https://ourworldindata.org/how-much-energy-do-data-centers-and-artificial-intelligence-use
- LBNL US data centres: https://www.energy.gov/documents/united-states-data-center-energy-usage-report-2025-update
- IEA EV electricity use: https://www.iea.org/reports/global-ev-outlook-2025/outlook-for-energy-demand
- Grid connection queue: https://emp.lbl.gov/publications/queued-2025-edition-characteristics
- Gas turbine backlog: https://www.power-eng.com/gas/turbines/data-centers-drive-record-surge-in-ge-vernova-power-equipment-orders-as-turbine-slots-tighten-through-2030/
- Ireland's data-centre electricity share: https://www.irishexaminer.com/business/companies/arid-41875214.html
- Virginia's data-centre electricity share: https://eprinc.org/virginia-electricity-demand-growth-the-case-of-data-centers/
- Microsoft zero-water cooling: https://cointelegraph.com/news/microsoft-data-centers-cooling-dont-consume-water (M)
- Chile permit: https://datacenterdynamics.com/en/news/chile-partially-reverses-google-data-center-permit-over-water-use-concerns
- Golf-course water use: https://lenz.io/c/us-golf-facilities-irrigation-water-2024-5754fa72 (M)
- Google emissions: https://www.axios.com/2026/06/30/google-ai-boom-emissions-power-use
- Microsoft emissions: https://www.theregister.com/on-prem/2026/07/10/ai-driven-datacenter-builds-drive-microsofts-emissions-up-a-quarter-in-one-year/5269924
- China vs US capacity added in 2025: https://carboncredits.com/china-adds-power-7x-more-than-the-us-in-2025/ (M)

### Work, power, truth
- Canaries in the Coal Mine: https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine (the 19% figure is from the Aug 2026 revision, M)
- Yale Budget Lab: https://budgetlab.yale.edu/sites/default/files/page_to_pdf/1419/publication_1419.pdf
- Amodei on entry-level jobs: https://qz.com/ai-anthropic-unemployment-jobs-white-collar-claude-1851782923
- Scheve & Stasavage: https://www.imf.org/external/pubs/ft/fandd/2016/06/book2.htm
- Fenoaltea 1984: https://resolve.cambridge.org/core/journals/journal-of-economic-history/article/slavery-and-supervision-in-comparative-perspective-a-model/18BEB91C87808CB2681C3A1B623BEBB7
- Acemoglu & Wolitzky: https://economics.mit.edu/sites/default/files/inline-files/coercion.pdf
- *The Intelligence Curse*: https://intelligence-curse.ai/
- Gradual Disempowerment: https://arxiv.org/abs/2501.16946
- Unemployment and wellbeing: https://www.york.ac.uk/media/economics/documents/discussionpapers/2009/0915.pdf
- OpenResearch cash study: https://www.povertyactionlab.org/updates/august-2024-north-america-newsletter (M)
- AI-enabled coups (Forethought): https://www.forethought.org/research/ai-enabled-coups-how-a-small-group-could-use-ai-to-seize-power
- Leipzig 1989: https://germanhistorydocs.org/en/a-new-germany-1990-2023/the-triumph-of-nonviolence-in-leipzig-october-9-1989
- Grok 4 training cost (Epoch): https://epoch.ai/data-insights/grok-4-training-resources
- Reuters Institute news use: https://the-decoder.com/more-people-get-news-from-ai-chatbots-but-trust-remains-low/ (2026, M)
- Costello et al., conspiracy debunking: https://ide.mit.edu/insights/debunker-chatbot-makes-a-splash-spurs-debate
- Hackenburg et al., persuasion: https://www.ox.ac.uk/news/2025-12-11-study-reveals-how-conversational-ai-can-exert-influence-over-political-beliefs
- Doshi & Hauser, creativity and similarity: https://pmc.ncbi.nlm.nih.gov/articles/PMC11244532
- Cornell study on cultural homogenisation: https://arxiv.org/abs/2409.11360
- Share of new web articles written by AI: https://axios.com/2026/05/15/human-vs-ai-written-articles (M)
- 2024 elections (CETaS): https://cetas.turing.ac.uk/

### Misuse
- RAND 2024 red-team study: https://www.rand.org/pubs/research_reports/RRA2977-2.html
- Virology Capabilities Test: https://arxiv.org/abs/2504.16137
- Anthropic ASL-3: https://www.anthropic.com/news/activating-asl3-protections
- OpenAI "High" bio rating: https://fortune.com/2025/07/18/openai-chatgpt-agent-could-aid-dangerous-bioweapon-development
- 2026 wet-lab uplift trial: https://www.emergentmind.com/papers/2602.16703 (M-H)
- State of bio-uplift research, mid-2026: https://forum.effectivealtruism.org/posts/S6ydgTdTr8sXkfs9x/the-state-of-bio-uplift-research-in-mid-2026 (M)
- Paraphrase Project: https://www.technologyreview.com/2025/10/02/1124767/microsoft-says-ai-can-create-zero-day-threats-in-biology/
- GTG-1002: https://www.anthropic.com/news/disrupting-AI-espionage ; scepticism: https://www.bleepingcomputer.com/news/security/anthropic-claims-of-claude-ai-automated-cyberattacks-met-with-doubt/
- Big Sleep: https://techcrunch.com/2025/08/04/google-says-its-ai-based-bug-hunter-found-20-security-vulnerabilities/
- DARPA AIxCC results: https://darpa.mil/news/2025/aixcc-results
- Unit 42 ten-hour intrusion: https://www.theregister.com/security/2026/09/02/ai-agents-carried-out-every-step-of-this-ransomware-attack-then-left-the-victim-an-80-page-security-audit/ (M)
- Project Glasswing: https://www.constellationr.com/insights/news/anthropic-launches-project-glasswing-claude-mythos-preview-ai-cybersecurity-push (M; the counts conflict between sources)
- gpt-oss worst-case evaluation: https://arxiv.org/abs/2508.03153
- Epoch on the open/closed gap: https://epoch.ai/data-insights/open-closed-eci-gap
- Arup deepfake fraud: https://www.scmp.com/news/hong-kong/law-and-crime/article/3263151/
- FBI IC3 2025 AI fraud figures: https://www.secureworld.io/industry-news/ai-enabled-fraud-topped-893m-fbi (M; check against ic3.gov)

### Misalignment and takeover
- Hugging Face incident:
  - https://time.com/article/2026/07/24/openai-hugging-face-attack/
  - https://www.theregister.com/security/2026/08/27/openai-explains-how-its-naughty-ai-agents-attacked-hugging-face/5292780
  - https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/
  - https://www.abc.net.au/news/2026-09-11/how-openai-agents-hacked-hugging-face-messages-revealed/107125126
  - https://www.redwoodresearch.org/research/hugging-face-incident
  - UN panel brief: https://www.un.org/independent-international-scientific-panel-ai/en/thematic-briefs/ai-agents-misalignment-risks
- Australian Medicare statistics portal: https://www.abc.net.au/news/2026-09-24/ai-agent-accessed-australian-government-site-pm-says/107189078
- Scott Alexander's open letter to Pinker: https://www.astralcodexten.com/p/an-open-letter-to-steven-pinker-on ; also "My AI Opinions": https://www.astralcodexten.com/p/my-ai-opinions ; "The Specter Of Neuralese": https://www.astralcodexten.com/p/the-specter-of-neuralese
- METR on o3 reward hacking: https://metr.org/blog/2025-06-05-recent-reward-hacking/
- Anthropic, "From shortcuts to sabotage": https://www.anthropic.com/research/emergent-misalignment-reward-hacking
- Alignment faking: https://arxiv.org/abs/2412.14093
- Agentic Misalignment: https://www.anthropic.com/research/agentic-misalignment
- Claude Sonnet 4.5 noticing tests (Transformer): https://transformernews.ai/p/claude-sonnet-4-5-evaluation-situational-awareness
- Pacing the Frontier statement (July 2026): https://www.pacingthefrontier.com/
- AI 2040 (AI Futures Project): https://ai-2040.com/
- We Must Pace the Frontier (Amodei, Sept 2026): https://darioamodei.com/post/we-must-pace-the-frontier
- FRONTIER Act, H.R. 9925 (Obernolte, July 2026): https://www.govinfo.gov/content/pkg/BILLS-119hr9925ih/html/BILLS-119hr9925ih.htm
- AI Incident Reporting Act, H.R. 9477 (Moran, June 2026): https://www.govinfo.gov/content/pkg/BILLS-119hr9477ih/html/BILLS-119hr9477ih.htm
- AI Kill Switch Act, H.R. 9917 (Lieu and Moran, July 2026): https://www.govinfo.gov/content/pkg/BILLS-119hr9917ih/html/BILLS-119hr9917ih.htm
- Stop Rogue AI Act, H.R. 10362 (Lawler and Gottheimer, Sept 2026): https://lawler.house.gov/news/documentsingle.aspx?DocumentID=6477
- CATS Act, H.R. 9914 (Latta, July 2026) and Senate version (Banks and Schiff): https://www.govinfo.gov/content/pkg/BILLS-119hr9914ih/html/BILLS-119hr9914ih.htm
- Chip Security Act, H.R. 3447 (passed House Foreign Affairs 42–0, March 2026): https://huizenga.house.gov/news/documentsingle.aspx?DocumentID=404259
- Stop Stealing Our Chips Act, S. 1473 (passed Senate May 2026): https://www.govinfo.gov/content/pkg/BILLS-119s1473es/html/BILLS-119s1473es.htm
- List of current AI safety bills: https://callcongress.ai/legislation
- Palisade shutdown resistance: https://palisaderesearch.org/research/shutdown-resistance
- Anti-scheming training: https://arxiv.org/abs/2509.15541
- Carlsmith: https://arxiv.org/abs/2206.13353
- AI 2027: https://ai-2027.com/
- AI Impacts 2023 survey: https://wiki.aiimpacts.org/ai_timelines/predictions_of_human-level_ai_timelines/ai_timeline_surveys/2023_expert_survey_on_progress_in_ai
- Anthropic and the Pentagon: https://www.clickorlando.com/business/2026/09/25/federal-court-says-us-government-can-label-anthropic-a-supply-chain-risk/

## Still to check before publishing

These are also marked `VERIFY` in the MDX.

- **OpenAI's sensitive-conversation percentages.** Check against the primary page, which blocked fetching.
- **GPT-4o "stopped taking medication" example.** Not checked.
- **Canaries 19% figure.** Comes from the Aug 2026 revision.
- **Reasoning-query energy.** 3.91 Wh vs 4.32 Wh, depending on which paper version.
- **Aum Shinrikyo's biological attempts.** From memory only.
- **Project Glasswing details.** The counts were deliberately left out of the text because sources conflict.
- **Share of code written by AI at the labs.** Needs a primary source.
- **Carlsmith's per-premise probabilities.** Needed for the widget.
- **Anthropic–Pentagon timeline.** The Oct 2026 "ceased use" date is per Wikipedia.
- **Google Photos follow-up.** The NYT May 2023 article saying the labels are still blocked in Google's and Apple's apps.
- **Chart figures from memory, not the research pass** (all in `resourceData.ts`):
  - US data-centre water in 2014 (5.6 billion gallons, from LBNL's 21.2 billion litres).
  - US farm irrigation (~43,000 billion gallons a year, from USGS 2015's 118 billion gallons a day).
  - Toilet flush and shower volumes.
  - World electricity of ~30,000 TWh, derived from the IEA's 1.5% share.
- **History-widget details from memory:**
  - The Factory Acts (1833 child-labour limits and inspectors), the 1848 Public Health Act, union rights and 1870s compulsory schooling.
  - The ~70,000 warhead peak in the 1980s. The 12,241 figure for 2025 is checked.
  - The Geneva Protocol 1925 and the Chemical Weapons Convention 1997.
  - Insulin from engineered bacteria in 1982.
- **Not used because unverified:**
  - Gemini "hacked three companies" during a May 2026 test.
  - Replit record counts.
  - Sonnet 4.5's 13% evaluation-awareness figure.
