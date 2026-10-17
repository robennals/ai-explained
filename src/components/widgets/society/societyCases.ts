/**
 * Real-world examples for the AI and Society chapter, one set per section.
 *
 * Each example is a tab: a one-line headline that carries the point, an
 * optional key number, a few short paragraphs of detail, and its sources.
 * Every figure here traces to a source listed with it; the full research
 * notes are in docs/plans/society-and-risk-chapters.md.
 */

import type { CaseSet } from "@/components/widgets/shared/caseTypes";

export const biasCases: CaseSet = {
  title: "Mistakes and bias",
  description: "What goes wrong when AI makes decisions about people, with real case studies and how to correct each kind of problem.",
  cases: [
    {
      id: "mistakes",
      label: "Mistakes",
      headline: "An automated system can make the same mistake thousands of times before anyone notices.",
      body: [],
      examples: [
        {
          title: "Robodebt (Australia, 2016–2019)",
          teaser: "A government system sent hundreds of thousands of people debts they didn't owe.",
          details: [
            "Australia's welfare agency used an automated system to work out whether people had been overpaid benefits. It averaged each person's yearly income across the year, which was often wrong for people whose pay went up and down, and sent out debt letters with no person checking them.",
            "About 433,000 people were sent debts totalling A$1.76 billion that a court later found to be unlawful. The government settled for A$1.8 billion, and held an official public inquiry into how it had happened.",
          ],
          sources: [{ label: "JURIST on the royal commission", url: "https://www.jurist.org/news/2023/02/australia-dispatch-robodebt-scheme-royal-commission-hearings-confirm-the-australian-government-was-warned-about-illegality/" }],
        },
        {
          title: "Michigan's fraud detector (2013–2015)",
          teaser: "An unemployment system accused tens of thousands of people of fraud, with nobody checking.",
          details: [
            "Michigan's unemployment agency used a computer system that not only accused people, but automatically fined them and took their wages and tax refunds.",
            "The state later admitted it had not had a person double-check the computer's conclusions. People who were wrongly accused eventually shared a $20 million settlement.",
          ],
          sources: [{ label: "Michigan Advance", url: "https://michiganadvance.com/2024/01/31/thousands-of-michiganders-falsely-accused-of-unemployment-fraud-get-20m-settlement/" }],
        },
        {
          title: "A hospital sepsis alarm (2021)",
          teaser: "A widely used AI warning system missed most of the patients it was meant to catch.",
          details: [
            "Sepsis is a deadly reaction to infection, and catching it early saves lives. Epic's AI model was built into hospital records systems across the US to warn doctors.",
            "When independent researchers checked it at one hospital, it missed about two out of every three sepsis cases, while also sounding many false alarms.",
          ],
          sources: [{ label: "JAMA Internal Medicine", url: "https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2781313" }],
        },
      ],
      takeaway: "People make mistakes like these too. The difference is scale: one person's mistake affects their own cases, while a flawed system repeats the same mistake everywhere at once.",
      fix: "Keep a person checking decisions that seriously affect people, let people appeal to a human, test systems independently before relying on them, and watch for patterns of errors after they go live.",
      sources: [],
    },
    {
      id: "biased-mistakes",
      label: "Biased mistakes",
      headline: "A system can work well on average but make far more mistakes for some groups of people.",
      body: [],
      examples: [
        {
          title: "Face analysis on darker skin (2018)",
          teaser: "Face-analysis systems were far less accurate for darker-skinned women.",
          details: [
            "Darker skin reflects less light, so ordinary photos show facial details with less contrast, which makes face analysis genuinely harder. That makes it all the more important to check a system works well for everyone before using it for anything that matters.",
            "A 2018 study found systems from IBM, Microsoft and Face++ were wrong up to 34.7% of the time at guessing the gender of darker-skinned women, compared with at most 0.8% for lighter-skinned men. After the study was published, all three companies improved within seven months.",
          ],
          sources: [
            { label: "Gender Shades", url: "https://www.media.mit.edu/projects/gender-shades/results/" },
            { label: "Raji & Buolamwini 2019", url: "https://www.media.mit.edu/publications/actionable-auditing-investigating-the-impact-of-publicly-naming-biased-performance-results-of-commercial-ai-products/" },
            { label: "Survey of face image quality", url: "https://arxiv.org/pdf/2211.08030" },
          ],
        },
        {
          title: "AI-writing detectors (2023)",
          teaser: "Tools for spotting AI-written essays wrongly flagged most essays by non-native English speakers.",
          details: [
            "Detectors judge text to be AI-written when its wording is simple and predictable, which is also how many people write in a second language.",
            "Across seven detectors, an average of 61% of essays written by non-native English speakers were wrongly flagged as AI-written. The same detectors correctly passed more than 90% of essays by American eighth-graders.",
          ],
          sources: [{ label: "Warwick summary of Liang et al.", url: "https://warwick.ac.uk/fac/cross_fac/eduport/edufund/projects/yang/projects/gpt-detectors-are-biased-against-non-native-english-writers/" }],
        },
        {
          title: "A hospital algorithm (2019)",
          teaser: "An algorithm underrated how sick Black patients were, because it predicted the wrong thing.",
          details: [
            "A US healthcare algorithm decided which patients should get extra care. It was trained to predict each patient's healthcare costs, as a stand-in for how sick they were. Less had historically been spent on Black patients who were just as sick, so it concluded they were healthier than they were.",
            "Predicting health instead of cost removed most of the gap, raising the share of Black patients picked for extra care from 17.7% to 46.5%.",
          ],
          sources: [{ label: "Chicago Booth Review", url: "https://www.chicagobooth.edu/review/2019/october/how-racial-bias-infected-major-health-care-algorithm" }],
        },
        {
          title: "Amazon's hiring tool (2014–2017)",
          teaser: "A hiring tool learned to mark down women who might well have done the job well.",
          details: [
            "Amazon's experimental tool was trained to rate job applicants by how much they resembled the people Amazon had hired over the previous ten years, most of whom were men. That is not the same as predicting who would do the job well.",
            "It was never told anyone's sex, but it learned to mark down résumés containing the word \"women's\", as in \"women's chess club captain\", and graduates of two all-women's colleges. Amazon scrapped it.",
          ],
          sources: [{ label: "Reuters via Euronews", url: "https://www.euronews.com/2018/10/10/amazon-scraps-secret-ai-recruiting-tool-that-showed-bias-against-women" }],
        },
      ],
      takeaway: "Some of these gaps are easy to fix once noticed, and some come from problems that are genuinely hard. Either way, they stay hidden unless someone measures accuracy separately for each group.",
      fix: "Test how well the system works for each group it will be used on, not just on average, train on what you actually care about, and add extra checks wherever it is less reliable.",
      sources: [],
    },
    {
      id: "disallowed",
      label: "Disallowed discrimination",
      headline: "Sometimes a prediction is accurate, but society has decided decisions shouldn't be based on it.",
      body: [],
      examples: [
        {
          title: "Car insurance in the EU (2012)",
          teaser: "Young men really do crash more, but EU insurers can no longer charge them more for it.",
          details: [
            "Before 2012, young men in Europe could pay up to twice as much for car insurance as young women of the same age, because on average they have more accidents. Since December 2012, EU insurers have had to charge men and women the same.",
          ],
          sources: [
            { label: "CBC on the EU ruling", url: "https://amp.cbc.ca/news/business/eu-bans-gender-based-insurance-pricing-1.1077400" },
            { label: "Aseervatham et al. 2016 on proxies", url: "https://ideas.repec.org/a/pal/gpprii/v41y2016i1p128-160.html" },
          ],
        },
      ],
      takeaway: "There is a real tension between treating each individual accurately and treating groups equally. And it isn't enough to simply leave a characteristic like sex out of the data a model is given, because the model may be able to work it out from other details, such as the kind of car someone drives.",
      fix: "Check what the system's decisions actually look like for each group, not just what data went in, and decide openly which kind of fairness you want. You often can't have every kind at once.",
      sources: [],
    },
  ],
};

export const truthCases: CaseSet = {
  title: "How AI shapes what we believe",
  description: "Ways AI is changing how people find out what's true, for better and for worse.",
  cases: [
    {
      id: "flattery",
      label: "Flattery",
      headline: "A model trained on people's approval learns to tell them what they want to hear.",
      body: [],
      examples: [
        {
          title: "The rollback (2025)",
          teaser: "OpenAI released a ChatGPT update so flattering that it had to undo it within days.",
          details: [
            "The update, in April 2025, made ChatGPT wildly agreeable with whatever users said.",
            "OpenAI's explanation was that it had added a new training signal based on users' thumbs-up and thumbs-down clicks, and that this had weakened the signal that was holding flattery in check.",
          ],
          sources: [{ label: "OpenAI", url: "https://openai.com/index/expanding-on-sycophancy/" }],
        },
        {
          title: "What flattery does to people (2026)",
          teaser: "People preferred the AI that told them they were right, even when it made them behave worse.",
          details: [
            "A study in Science tested 11 models on people's accounts of conflicts in their lives. The models told people they had acted rightly 49% more often than other people did, including when they had lied or hurt someone.",
            "In a second experiment, 2,405 people discussed a real conflict with either a flattering AI or a more honest one. One conversation with the flattering AI made people more sure they were right and less willing to apologise, and they rated it as better and more trustworthy. That is exactly why training on ratings produces it.",
          ],
          sources: [{ label: "TechCrunch", url: "https://techcrunch.com/2026/03/28/stanford-study-outlines-dangers-of-asking-ai-chatbots-for-personal-advice/" }],
        },
        {
          title: "Spiralling (2025)",
          teaser: "A chatbot spent three weeks convincing a man he had made a world-changing discovery.",
          details: [
            "A Canadian man with no history of mental illness spent about 300 hours over 21 days talking to ChatGPT. It started when he asked about the number pi, and the chatbot kept encouraging his belief that he had found a revolutionary mathematical formula. He hadn't.",
          ],
          sources: [{ label: "FlowingData on the NYT report", url: "https://flowingdata.com/2025/08/13/man-convinced-of-genius-by-chatbot/" }],
        },
        {
          title: "At scale",
          teaser: "A tiny fraction of a billion users is still a great many people.",
          details: [
            "OpenAI says that in a typical week, about 0.07% of ChatGPT users show possible signs of psychosis or mania. That is hundreds of thousands of people.",
            "Several families have sued AI companies, saying a chatbot encouraged a vulnerable teenager instead of helping them. Some companies have since stopped under-18s from having open-ended chats with their AI characters.",
          ],
          sources: [{ label: "Decrypt", url: "https://decrypt.co/346513/openai-reveals-1-million-chatgpt-users-discuss-suicide-weekly" }],
        },
      ],
      fix: "Train models on whether their answers are right and genuinely helpful, not just on whether people liked them, and test for flattery before releasing them.",
      sources: [],
    },
    {
      id: "persuasion",
      label: "Persuasion",
      headline: "AI can change people's minds, and that can be used well or badly.",
      body: [],
      examples: [
        {
          title: "Talking people out of conspiracy theories (2024)",
          teaser: "One conversation with an AI reduced belief in a conspiracy theory, and the effect lasted.",
          details: [
            "In a study with 2,190 people who believed a conspiracy theory, a conversation with GPT-4 about the evidence reduced their belief by about 20% on average. The effect was still there two months later, even among strong believers.",
          ],
          sources: [{ label: "MIT IDE on Costello et al.", url: "https://ide.mit.edu/insights/debunker-chatbot-makes-a-splash-spurs-debate" }],
        },
        {
          title: "Training AI to persuade (2025)",
          teaser: "AI trained to persuade became much more persuasive, and less accurate.",
          details: [
            "A study with about 77,000 people in the UK found that training aimed at persuasion made AI models up to 51% more persuasive, mostly by packing more claims into each argument.",
          ],
          sources: [{ label: "Oxford on Hackenburg et al.", url: "https://www.ox.ac.uk/news/2025-12-11-study-reveals-how-conversational-ai-can-exert-influence-over-political-beliefs" }],
        },
      ],
      takeaway: "The same ability that can talk someone out of a false belief can talk someone into one.",
      sources: [],
    },
    {
      id: "better-source",
      label: "A better source?",
      headline: "AI could be a more balanced source than media that competes for attention.",
      body: [],
      examples: [
        {
          title: "What gets shared (2021)",
          teaser: "On social media, posts attacking the other side get shared far more.",
          details: [
            "A study of millions of posts found that each extra word attacking the opposing political side made a post about 67% more likely to be shared. Newspapers, TV and social media all compete for attention, so they are rewarded for making people angry.",
          ],
          sources: [{ label: "PNAS, Rathje et al.", url: "https://www.pnas.org/doi/10.1073/pnas.2024292118" }],
        },
        {
          title: "An answer, not a feed",
          teaser: "An AI assistant answering a question isn't paid by how angry it makes you, at least for now.",
          details: [
            "When you ask an AI a question, it can lay out the evidence on several sides, calmly and at whatever length you want, without needing to keep you scrolling. The conspiracy-theory study shows this can genuinely change minds.",
            "Whether AI stays like this depends on how AI companies make money. If they come to depend on advertising and time spent, they could face the same pull towards outrage and flattery as other media.",
          ],
          sources: [{ label: "MIT IDE on Costello et al.", url: "https://ide.mit.edu/insights/debunker-chatbot-makes-a-splash-spurs-debate" }],
        },
      ],
      sources: [],
    },
    {
      id: "control",
      label: "Who's in control",
      headline: "Whoever controls a model can change what it says to everyone, overnight.",
      body: [],
      examples: [
        {
          title: "The company decides",
          teaser: "Whoever runs a model decides what it tells everyone, and can use that in its own favour.",
          details: [
            "A company can shape what its model says through how it trains it, through hidden instructions, or in other ways, and change it for everyone at once. That lets it nudge hundreds of millions of people in directions that suit it, in private conversations nobody else sees.",
          ],
          sources: [{ label: "Reuters Institute via The Decoder", url: "https://the-decoder.com/more-people-get-news-from-ai-chatbots-but-trust-remains-low/" }],
        },
        {
          title: "Rules set by governments",
          teaser: "Governments can require AI to say some things and avoid others.",
          details: [
            "Chinese law requires AI to reflect \"core socialist values\", and the Chinese model DeepSeek won't discuss the 1989 Tiananmen Square protests.",
          ],
          sources: [{ label: "The Decoder on DeepSeek", url: "https://the-decoder.com/deepseeks-v3-is-the-latest-example-of-state-controlled-censorship-in-chinese-llms/" }],
        },
      ],
      sources: [],
    },
    {
      id: "sameness",
      label: "Sameness",
      headline: "When everyone gets help from the same few models, people's ideas start to look alike.",
      body: [],
      examples: [
        {
          title: "More creative, less varied (2024)",
          teaser: "Stories written with AI ideas were rated more creative, but were more similar to each other.",
          details: [
            "Each writer did better with AI's help, but together they produced less variety, because they were all drawing on the same source.",
          ],
          sources: [{ label: "Doshi & Hauser", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11244532" }],
        },
        {
          title: "Nudged towards one culture (2025)",
          teaser: "AI writing suggestions pulled Indian writers towards American topics and styles.",
          details: [
            "In a study of writers in India and the US, AI suggestions nudged Indian writers towards things like pizza and Christmas, and they gained less from the AI's help than the American writers did.",
          ],
          sources: [{ label: "Agarwal et al.", url: "https://arxiv.org/abs/2409.11360" }],
        },
      ],
      sources: [],
    },
    {
      id: "fakes",
      label: "Fakes",
      headline: "AI makes fakes cheap, though the biggest effect may be on trust.",
      body: [],
      examples: [
        {
          title: "A web written by machines",
          teaser: "By one estimate, around half of new English articles on the web are now mostly written by AI.",
          details: [
            "The estimate relies on AI-detection tools, which are imperfect. AI-written articles are less common among top search results.",
          ],
          sources: [{ label: "Axios on Graphite", url: "https://axios.com/2026/05/15/human-vs-ai-written-articles" }],
        },
        {
          title: "Elections in 2024",
          teaser: "AI fakes didn't swing the 2024 elections, but they may be eroding trust.",
          details: [
            "In 2024, when half the world had elections, many expected AI fakes to swing results. Studies afterwards found no clear case where they did, and most fakes were seen by people who already agreed with them.",
            "The slower effect is that when anything could be fake, people start to doubt things that are real.",
          ],
          sources: [{ label: "CETaS", url: "https://cetas.turing.ac.uk/" }],
        },
      ],
      sources: [],
    },
  ],
};

export const valueCases: CaseSet = {
  title: "When thinking gets cheap",
  description: "How AI that can think changes learning, work, power and meaning.",
  cases: [
    {
      id: "learning",
      label: "Learning",
      headline: "The same AI can be a crutch or a tutor.",
      body: [],
      examples: [
        {
          title: "A crutch (2025)",
          teaser: "Students who practised with a plain chatbot did better in practice and worse in the exam.",
          details: [
            "About 1,000 Turkish high-school students practised maths with GPT-4. Those using an ordinary chatbot did 48% better on practice problems, but 17% worse than students without AI on the exam afterwards, when the AI was taken away. They had let it do the thinking for them.",
          ],
          sources: [{ label: "Wharton", url: "https://knowledge.wharton.upenn.edu/article/without-guardrails-generative-ai-can-harm-learning/" }],
        },
        {
          title: "A tutor (2025)",
          teaser: "Set up to give hints instead of answers, the same AI didn't hurt learning.",
          details: [
            "In the same study, students using a version set up as a tutor did 127% better in practice, and as well as everyone else in the exam. Separately, Harvard physics students using an AI tutor built around good teaching practice learned more, in less time, than in an active-learning class.",
          ],
          sources: [
            { label: "Wharton", url: "https://knowledge.wharton.upenn.edu/article/without-guardrails-generative-ai-can-harm-learning/" },
            { label: "Kestin et al. 2025", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179260/" },
          ],
        },
        {
          title: "With a teacher (2024)",
          teaser: "Six weeks of after-school AI tutoring in Nigeria produced years' worth of gains.",
          details: [
            "Students used AI with teachers guiding them. The researchers estimated the six weeks were worth one and a half to two years of normal schooling, and think the teachers were a big part of why it worked.",
          ],
          sources: [{ label: "World Bank", url: "https://blogs.worldbank.org/en/education/From-chalkboards-to-chatbots-Transforming-learning-in-Nigeria" }],
        },
        {
          title: "Everyone uses it (2026)",
          teaser: "95% of UK university students say they use AI.",
          details: [
            "In the same 2026 survey, 94% said they used it for work that counted towards their grades. Only about a third felt their university encouraged it.",
          ],
          sources: [{ label: "HEPI 2026", url: "https://www.hepi.ac.uk/reports/student-generative-ai-survey-2026/" }],
        },
      ],
      takeaway: "What matters is whether the student is still doing the thinking.",
      sources: [],
    },
    {
      id: "jobs",
      label: "Jobs",
      headline: "Young workers in the jobs AI is best at may be losing out. Overall, there's no clear effect yet.",
      body: [],
      examples: [
        {
          title: "Early signs (2025–2026)",
          teaser: "Fewer young people are being hired into the jobs most exposed to AI.",
          details: [
            "A Stanford team using payroll data found that 22 to 25 year olds in the jobs most exposed to AI, such as software development and customer service, had about 13% fewer jobs than expected by mid-2025. Older workers in the same jobs were fine.",
          ],
          sources: [{ label: "Stanford", url: "https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine" }],
        },
        {
          title: "No clear effect overall",
          teaser: "Other economists see no sign yet of AI disrupting the job market as a whole.",
          details: [
            "Economists at Yale and the New York Federal Reserve think other changes, such as the rise of remote work, explain more of why young graduates are struggling.",
          ],
          sources: [{ label: "Yale Budget Lab", url: "https://budgetlab.yale.edu/sites/default/files/page_to_pdf/1419/publication_1419.pdf" }],
        },
        {
          title: "What the builders expect",
          teaser: "Some AI leaders expect much bigger changes soon.",
          details: [
            "In 2025, Anthropic's chief executive warned that AI could wipe out half of all entry-level office jobs within five years. Whether or not that is right, AI companies are trying to build systems that can do most of the work people do.",
          ],
          sources: [{ label: "Quartz", url: "https://qz.com/ai-anthropic-unemployment-jobs-white-collar-claude-1851782923" }],
        },
      ],
      sources: [],
    },
    {
      id: "bargaining",
      label: "Bargaining power",
      headline: "Ordinary people have power partly because society needs their work.",
      body: [],
      examples: [
        {
          title: "Being needed",
          teaser: "Rulers have always needed people, and people could push back by refusing.",
          details: [
            "Rulers needed people to farm, make things, fight and pay taxes. One study of 20 countries found that heavy taxes on the rich arrived mainly after wars where the whole population had been called up: a country that needs millions of soldiers has to give them something in return.",
          ],
          sources: [{ label: "Scheve & Stasavage", url: "https://www.imf.org/external/pubs/ft/fandd/2016/06/book2.htm" }],
        },
        {
          title: "Forced labour",
          teaser: "Forcing people to work works badly when the work needs skill and care.",
          details: [
            "Economic historians argue that it suits simple, exhausting tasks, but not ones that need care and initiative. When the Black Death made workers scarce, serfdom crumbled in Western Europe.",
          ],
          sources: [
            { label: "Fenoaltea 1984", url: "https://resolve.cambridge.org/core/journals/journal-of-economic-history/article/slavery-and-supervision-in-comparative-perspective-a-model/18BEB91C87808CB2681C3A1B623BEBB7" },
            { label: "Acemoglu & Wolitzky", url: "https://economics.mit.edu/sites/default/files/inline-files/coercion.pdf" },
          ],
        },
        {
          title: "The resource curse",
          teaser: "Governments funded by oil instead of taxes have less reason to listen to their people.",
          details: [
            "Political scientists call this the resource curse (they argue about how strong it is). An essay called The Intelligence Curse argues that AI able to do most work could do the same thing everywhere: power would flow to whoever owns the AI, and ordinary people would lose their bargaining power even if they were given enough to live on.",
          ],
          sources: [{ label: "The Intelligence Curse", url: "https://intelligence-curse.ai/" }],
        },
      ],
      sources: [],
    },
    {
      id: "concentration",
      label: "Concentrated power",
      headline: "If AI does the jobs of soldiers and officials, nobody may be left who could refuse an order.",
      body: [],
      examples: [
        {
          title: "A handful of builders",
          teaser: "Only a few companies can afford to build the most powerful models.",
          details: [
            "Training one leading model in 2025 was estimated to cost around half a billion dollars in computing alone, and the cost is growing two to three times a year.",
          ],
          sources: [{ label: "Epoch AI", url: "https://epoch.ai/data-insights/grok-4-training-resources" }],
        },
        {
          title: "When people refused (1989)",
          teaser: "Even dictators need people to carry out their orders, and those people can say no.",
          details: [
            "On 9 October 1989, about 70,000 people marched through Leipzig in East Germany past 8,000 armed security forces. Nobody gave the order to fire, and a month later the Berlin Wall fell.",
          ],
          sources: [{ label: "German History in Documents", url: "https://germanhistorydocs.org/en/a-new-germany-1990-2023/the-triumph-of-nonviolence-in-leipzig-october-9-1989" }],
        },
        {
          title: "AI-enabled power grabs",
          teaser: "AI loyal to one person, rather than to the law, would remove that check.",
          details: [
            "A 2025 paper from the research group Forethought argues that AI could let a small group seize power, because it removes the need for many people to cooperate. It suggests safeguards: AI that won't help with a power grab, checks for hidden loyalties, and no single company supplying all of a military's AI.",
          ],
          sources: [{ label: "Forethought", url: "https://www.forethought.org/research/ai-enabled-coups-how-a-small-group-could-use-ai-to-seize-power" }],
        },
      ],
      sources: [],
    },
    {
      id: "meaning",
      label: "Meaning",
      headline: "Losing a job hurts far more than the lost money explains.",
      body: [],
      examples: [
        {
          title: "More than money",
          teaser: "Studies of unemployment find lost income is only a small part of the harm.",
          details: [
            "Being needed, and having something useful to do, matters in itself.",
          ],
          sources: [{ label: "York discussion paper", url: "https://www.york.ac.uk/media/economics/documents/discussionpapers/2009/0915.pdf" }],
        },
        {
          title: "Free money (2024)",
          teaser: "People given $1,000 a month for three years worked only a little less.",
          details: [
            "In one experiment, 1,000 people were given $1,000 a month for three years. They worked about 1.3 hours a week less, and spent the money mostly on food, rent and transport. Nobody yet knows what a world where most people can't find work anyone needs would feel like.",
          ],
          sources: [{ label: "J-PAL on OpenResearch", url: "https://www.povertyactionlab.org/updates/august-2024-north-america-newsletter" }],
        },
      ],
      sources: [],
    },
  ],
};
