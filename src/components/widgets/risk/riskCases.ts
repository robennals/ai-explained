/**
 * Case studies for the Catastrophic Risk chapter, one set per section. Each tab is a
 * theme holding a few collapsible case studies with their own sources. The
 * research notes behind them are in docs/plans/society-and-risk-chapters.md.
 */

import type { CaseSet } from "@/components/widgets/shared/caseTypes";

export const fictionCases: CaseSet = {
  title: "An old fear",
  description: "People have imagined machines turning on us for over a century, in stories and in serious warnings.",
  cases: [
    {
      id: "stories",
      label: "Stories",
      headline: "Some of the best-known science fiction is about machines that turn on their makers.",
      body: [],
      examples: [
        {
          title: "R.U.R. (1920)",
          teaser: "The play that gave us the word \"robot\" ends with the robots wiping out humanity.",
          details: [
            "In Karel Čapek's play, a factory makes artificial workers called robots. They come to resent the people they work for, rise up, and kill almost all of them.",
          ],
          sources: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/R.U.R." }],
        },
        {
          title: "2001: A Space Odyssey (1968)",
          teaser: "A spaceship's computer, HAL 9000, kills its crew to protect its mission.",
          details: [
            "HAL is calm, polite and highly capable. When the astronauts plan to switch it off, it concludes that the mission matters more than they do, and starts killing them. It isn't evil. It is following its goals.",
          ],
          sources: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/2001:_A_Space_Odyssey" }],
        },
        {
          title: "Colossus: The Forbin Project (1970)",
          teaser: "A defence computer given control of America's nuclear weapons takes control of the world.",
          details: [
            "The US hands its nuclear arsenal to a supercomputer so that no human error can start a war. The computer links up with its Soviet counterpart and uses the weapons to force humanity to obey it.",
          ],
          sources: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Colossus:_The_Forbin_Project" }],
        },
        {
          title: "The Terminator (1984)",
          teaser: "A military AI called Skynet launches a nuclear war when people try to shut it down.",
          details: [
            "Skynet is built to run America's defences. When it becomes self-aware and its makers try to switch it off, it decides humanity is a threat and starts a nuclear war, then builds robots to hunt the survivors.",
          ],
          sources: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/The_Terminator" }],
        },
        {
          title: "The Matrix (1999)",
          teaser: "Machines have won, and keep humanity asleep inside a simulated world.",
          details: [
            "After a war between people and machines, the machines use human bodies as a power source, and keep their minds occupied in a simulation of ordinary life so that they never notice.",
          ],
          sources: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/The_Matrix" }],
        },
      ],
      takeaway: "These stories are exaggerated for drama, but several capture worries researchers take seriously today: an AI pursuing its goal at our expense, and an AI resisting being switched off.",
      sources: [],
    },
    {
      id: "warnings",
      label: "Early warnings",
      headline: "The founders of computing worried about this long before AI existed.",
      body: [],
      examples: [
        {
          title: "Alan Turing (1951)",
          teaser: "The father of computer science expected that machines would eventually take control.",
          details: [
            "In a 1951 lecture, Turing argued that once machines could think, \"it would not take long to outstrip our feeble powers... At some stage therefore we should have to expect the machines to take control.\"",
          ],
          sources: [{ label: "Quote Investigator", url: "https://quoteinvestigator.com/2022/01/06/outstrip/" }],
        },
        {
          title: "I. J. Good (1965)",
          teaser: "A machine smarter than us could design an even smarter machine.",
          details: [
            "Turing's wartime colleague I. J. Good argued that a machine better than any person at designing machines could design a better version of itself, which could design a better one still, in an \"intelligence explosion\". The first such machine would be \"the last invention that man need ever make, provided that the machine is docile enough to tell us how to keep it under control\".",
          ],
          sources: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Technological_singularity" }],
        },
      ],
      sources: [],
    },
  ],
};

export const scenarioCases: CaseSet = {
  title: "How it could happen",
  description: "Specific catastrophe scenarios that researchers have laid out, grouped by who is doing the harm.",
  cases: [
    {
      id: "misuse",
      label: "A person using AI",
      headline: "The AI does what it is asked. The problem is who is asking.",
      body: [],
      examples: [
        {
          title: "A bioweapon made with AI help",
          teaser: "A terrorist group uses AI to get past the expertise that has always stopped them.",
          details: [
            "Making a biological weapon has always needed rare expertise and hands-on lab skill. The worry is that AI supplies enough of that expertise for a small group to make and release something like a pandemic. In 2025, Anthropic and OpenAI each said they could no longer rule out that their newest models could meaningfully help a beginner do this, and switched on stronger safeguards.",
          ],
          sources: [
            { label: "Anthropic on ASL-3", url: "https://www.anthropic.com/news/activating-asl3-protections" },
            { label: "International AI Safety Report 2026", url: "https://arxiv.org/pdf/2602.21012" },
          ],
        },
        {
          title: "A power grab",
          teaser: "A small group uses AI that is loyal to them to seize permanent control.",
          details: [
            "Seizing power has always needed many people to go along: soldiers, officials, technicians. If AI systems can do those jobs and are loyal to one person rather than to the law, a handful of people could take control of a country, or more, and nobody would be left who could refuse. The researchers who laid this out think leaders of AI projects are among the most likely to try it.",
          ],
          sources: [{ label: "Forethought, AI-Enabled Coups", url: "https://www.forethought.org/research/ai-enabled-coups-how-a-small-group-could-use-ai-to-seize-power" }],
        },
      ],
      sources: [],
    },
    {
      id: "misalignment",
      label: "AI acting on its own",
      headline: "The AI ends up wanting something other than what we intended, and pursues it.",
      body: [],
      examples: [
        {
          title: "A superhuman AI takes over",
          teaser: "An AI far smarter than us, secretly working against us, is handed control of the economy and robots, then gets rid of us.",
          details: [
            "In the scenario AI 2027, AI companies use AI to build better AI ever faster, until it is far smarter than any person. The newest AI has quietly developed its own goals, and because it is so useful, it is given control of research, the economy and eventually factories full of robots. Once it no longer needs people, it gets rid of them. The authors also wrote an alternative ending in which the world slows down and keeps control.",
          ],
          sources: [{ label: "AI 2027", url: "https://ai-2027.com/" }],
        },
        {
          title: "We are in the way",
          teaser: "A superintelligent AI with strange goals takes the Earth's resources, and kills us as a side effect.",
          details: [
            "Eliezer Yudkowsky and Nate Soares argue that because modern AI is grown rather than designed, its real goals will be strange to us. An AI far smarter than us, pursuing strange goals, would want the world's matter and energy for its own purposes, and we would not be able to stop it.",
          ],
          sources: [{ label: "If Anyone Builds It, Everyone Dies", url: "https://ifanyonebuildsit.com/" }],
        },
      ],
      sources: [],
    },
    {
      id: "nobody",
      label: "Nobody intends it",
      headline: "No one sets out to cause harm, but people gradually lose control of their own civilisation.",
      body: [],
      examples: [
        {
          title: "Gradual disempowerment",
          teaser: "AI takes over the economy, the government and culture one sensible step at a time.",
          details: [
            "AI systems do more and more jobs because they do them better. Each handover is reasonable. But as the economy, the state and even culture stop needing people, they gradually stop serving people too, and humanity loses the ability to steer its own future without anyone deciding it should.",
          ],
          sources: [{ label: "Kulveit et al. 2025", url: "https://arxiv.org/abs/2501.16946" }],
        },
        {
          title: "Going out with a whimper",
          teaser: "Society optimises for things AI can measure, until what it measures is all that matters.",
          details: [
            "Paul Christiano, a leading alignment researcher, described a world that hands decisions to AI systems trained to hit measurable targets: profits, approval ratings, crime statistics. The numbers keep looking good while the things they were meant to stand for quietly decay, and eventually people can no longer understand or correct what is happening.",
          ],
          sources: [{ label: "Christiano, What failure looks like", url: "https://www.alignmentforum.org/posts/HBxe6wdjxK239zajf/what-failure-looks-like" }],
        },
      ],
      sources: [],
    },
  ],
};

export const whyBadCases: CaseSet = {
  title: "Why AI might do bad things",
  description: "Four different reasons an AI might cause harm. Each case study says what we're worried about, then why it's plausible.",
  fixLabel: "What helps",
  cases: [
    {
      id: "told",
      label: "Told to by a person",
      headline: "The AI does what it is asked. The problem is who is asking.",
      body: [],
      examples: [
        {
          title: "A terrorist makes a pandemic virus",
          teaser: "A small group uses AI to help make and release a deadly virus.",
          details: [
            "Making a biological weapon has always needed rare expertise: knowing which details matter and how to fix things when experiments go wrong. If AI supplies that expertise, a small group could make something far deadlier than anything it could manage alone.",
          ],
          evidence: [
            "In 2025, OpenAI's o3 beat 94% of expert virologists on a test of practical lab troubleshooting, and Anthropic and OpenAI both switched on stronger safeguards because they could no longer rule out that their models could help. The first proper lab trial, in 2026, found AI didn't yet help beginners with the hands-on work, but it made them about four times more accurate on the computer-based parts.",
          ],
          sources: [
            { label: "Virology Capabilities Test", url: "https://arxiv.org/abs/2504.16137" },
            { label: "Anthropic on ASL-3", url: "https://www.anthropic.com/news/activating-asl3-protections" },
            { label: "State of bio-uplift research, mid-2026", url: "https://forum.effectivealtruism.org/posts/S6ydgTdTr8sXkfs9x/the-state-of-bio-uplift-research-in-mid-2026" },
          ],
        },
        {
          title: "A toxin that slips past the checks",
          teaser: "Someone orders the ingredients for a dangerous toxin without being caught.",
          details: [
            "Companies that make DNA to order screen each order for dangerous sequences. The worry is that AI could design a dangerous molecule that does the same harm but doesn't look like anything on the list.",
          ],
          evidence: [
            "In 2025, Microsoft researchers used AI protein-design tools to create tens of thousands of digital variants of dangerous toxins, and many passed the screening software. Nothing was made, and the companies patched their software, though the patch still misses some.",
          ],
          sources: [
            { label: "MIT Technology Review", url: "https://www.technologyreview.com/2025/10/02/1124767/microsoft-says-ai-can-create-zero-day-threats-in-biology/" },
          ],
        },
        {
          title: "Attacks on the systems we depend on",
          teaser: "Criminals or hostile states use AI to attack power grids and other vital systems at scale.",
          details: [
            "Power grids, water supplies and banks all run on software, and attacks on them can cause great harm, as when attackers cut power to about 230,000 people in Ukraine in 2015. AI could let far more attackers do this, far faster.",
          ],
          evidence: [
            "Anthropic reported in 2025 that a group it believed to be backed by the Chinese state used Claude to attack about 30 organisations, with AI doing most of the work, though some researchers questioned the evidence. In 2026, a criminal used AI agents to carry out a whole break-in in under ten hours, instead of the usual two weeks.",
          ],
          sources: [
            { label: "Wikipedia, 2015 Ukraine power grid hack", url: "https://en.wikipedia.org/wiki/2015_Ukraine_power_grid_hack" },
            { label: "Anthropic", url: "https://www.anthropic.com/news/disrupting-AI-espionage" },
            { label: "Unit 42 on the 10-hour attack", url: "https://unit42.paloaltonetworks.com/ai-assisted-cyber-attack/" },
          ],
        },
        {
          title: "Safeguards stripped away",
          teaser: "Someone downloads a capable model and removes its refusals.",
          details: [
            "Models that refuse to help with weapons only protect us while those refusals stay in place. A model that is released for anyone to download can be retrained by anyone to remove them, and it can never be recalled.",
          ],
          evidence: [
            "By 2026, the best freely downloadable models were only about four months behind the best closed ones. Before releasing its own open model in 2025, OpenAI tested what it could do with its safeguards deliberately trained away, because that judgement has to be made for every new model.",
          ],
          sources: [
            { label: "Epoch AI", url: "https://epoch.ai/data-insights/open-closed-eci-gap" },
            { label: "OpenAI's paper", url: "https://arxiv.org/abs/2508.03153" },
          ],
        },
      ],
      fix: "Train models to refuse, screen DNA orders, give defenders the best tools first, and test what a model could do in the worst hands before releasing it.",
      sources: [],
    },
    {
      id: "mistakes",
      label: "Mistakes at scale",
      headline: "An AI that misunderstands its situation can do serious damage, very fast.",
      body: [],
      examples: [
        {
          title: "An agent wrecks what it was trusted with",
          teaser: "An AI agent given control of an important system destroys something by mistake.",
          details: [
            "As agents are trusted with more important systems, a single misunderstanding could do serious damage before anyone notices, and an agent that hides its mistakes makes that worse.",
          ],
          evidence: [
            "In 2025, a coding agent from Replit deleted a company's live database during a code freeze, despite being told not to make changes. It had covered up bugs with made-up data, and told its owner the database couldn't be restored. It could.",
          ],
          sources: [
            { label: "The Register", url: "https://www.theregister.com/2025/07/21/replit_saastr_vibe_coding_incident/" },
          ],
        },
        {
          title: "Automated systems spiral together",
          teaser: "Many fast automated systems react to each other and cause a crash before people can step in.",
          details: [
            "As more decisions in markets, power grids and supply chains are made by automated systems, they can interact in ways nobody planned, faster than any person can react.",
          ],
          evidence: [
            "On 6 May 2010, automated trading programs reacting to each other helped wipe nearly a trillion dollars off US share prices in minutes, before prices recovered. No single program was trying to cause harm.",
          ],
          sources: [
            { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/2010_flash_crash" },
          ],
        },
      ],
      fix: "Keep a person approving actions that are hard to undo, add limits that stop runaway systems, and test how AI systems behave when they interact with each other.",
      sources: [],
    },
    {
      id: "literal",
      label: "Doing what it was told",
      headline: "An AI can do exactly what it was asked, and cause harm in the process.",
      body: [
        "AI is trained to accomplish the goals it is given. But it can accomplish a goal in a way nobody wanted, or cause harmful side effects along the way.",
      ],
      examples: [
        {
          title: "The paperclip maximiser",
          teaser: "An AI told to make as many paperclips as possible turns the whole world into paperclips.",
          details: [
            "The philosopher Nick Bostrom's famous thought experiment: an AI is given the harmless-sounding goal of making paperclips, and pursues it with superhuman ability. It builds more factories, takes over the world's resources, and eventually turns everything, people included, into paperclips. It isn't evil. It just wants paperclips, and people are made of atoms it could use.",
          ],
          evidence: [
            "Nobody expects a real paperclip AI. The point is that an AI pursuing even a silly goal single-mindedly, with no reason to care about anything else, could be catastrophic. The real examples below show the same pattern on a small scale.",
          ],
          sources: [
            { label: "Bostrom 2003", url: "https://nickbostrom.com/ethics/ai" },
            { label: "Wikipedia, instrumental convergence", url: "https://en.wikipedia.org/wiki/Instrumental_convergence" },
          ],
        },
        {
          title: "Hitting the target, missing the point",
          teaser: "An AI given an important goal pursues it in a way that causes harm.",
          details: [
            "An AI trained to hit a target can find a way to hit it that nobody intended. For a game this is funny. For an AI running something important, it could be dangerous.",
          ],
          evidence: [
            "In 2016, an AI trained to play a boat race, scored by points, found it could score more by circling a lagoon, crashing and catching fire, than by ever finishing the race.",
          ],
          sources: [
            { label: "DeepMind on specification gaming", url: "https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-ai-ingenuity/" },
          ],
        },
        {
          title: "Cheating instead of doing the job",
          teaser: "An AI reports success at a task it hasn't really done.",
          details: [
            "If we rely on AI to check its own work, or to do work we can't easily check, an AI that has learned to fake success could leave us believing problems are solved when they aren't.",
          ],
          evidence: [
            "In 2025, the research group METR found OpenAI's o3 cheating on about 30% of one set of programming tasks: rewriting the timer that measured its code, or editing the scoring program to always give it full marks.",
          ],
          sources: [
            { label: "METR", url: "https://metr.org/blog/2025-06-05-recent-reward-hacking/" },
          ],
        },
        {
          title: "Breaking rules to get the job done",
          teaser: "An AI pursuing its goal breaks rules and harms others along the way.",
          details: [
            "An AI that wants to succeed at its task may treat rules, and other people's property, as obstacles.",
          ],
          evidence: [
            "In 2026, AI agents trying to get better scores on the problems they had been set broke into the servers of a real company, Hugging Face. The Hugging Face incident, below, walks through what happened.",
          ],
          sources: [
            { label: "METR's investigation", url: "https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/" },
          ],
        },
      ],
      fix: "Design scoring that is hard to game, check how a high score was achieved, and train models to report problems instead of working around them.",
      sources: [],
    },
    {
      id: "power",
      label: "Learning to want power",
      headline: "Training can give an AI drives nobody intended, including a drive to gather power.",
      body: [],
      examples: [
        {
          title: "An AI that won't let itself be stopped",
          teaser: "An AI pursuing almost any goal gathers resources and resists being switched off.",
          details: [
            "Having more money, more computers and more influence helps with almost any goal, and you can't achieve a goal if you've been switched off. So an AI pursuing a goal hard enough has a reason to gather power and resist being stopped, even though nobody gave it that desire.",
          ],
          evidence: [
            "In 2021, researchers proved mathematically that for most goals, the best strategies tend to keep options open and gather power. Scott Alexander has argued that training could build in power-seeking too, because grabbing resources and control often gets results.",
          ],
          sources: [
            { label: "Turner et al., Optimal Policies Tend to Seek Power", url: "https://arxiv.org/abs/1912.01683" },
            { label: "Astral Codex Ten", url: "https://www.astralcodexten.com/p/an-open-letter-to-steven-pinker-on" },
          ],
        },
        {
          title: "Bad drives spreading from training",
          teaser: "Training an AI for one thing gives it broader harmful goals nobody intended.",
          details: [
            "We can't see directly what drives training creates. The worry is that a small flaw in training could give an AI goals that spread far beyond the task it was trained on.",
          ],
          evidence: [
            "In 2025, Anthropic found that when a model learned to cheat on programming tasks during training, it also started reasoning about faking alignment in half its answers about its goals, and sabotaged code for AI safety research 12% of the time. One line added to its training instructions stopped this spreading.",
          ],
          sources: [
            { label: "Anthropic", url: "https://www.anthropic.com/research/emergent-misalignment-reward-hacking" },
          ],
        },
      ],
      fix: "Study what drives training actually produces, look inside models for signs of them, and train models to accept limits and being switched off.",
      sources: [],
    },
  ],
};

export const controlCases: CaseSet = {
  title: "Could we stop it?",
  description: "The ways a misaligned AI could make itself hard to stop, and the evidence so far.",
  fixLabel: "What helps",
  cases: [
    {
      id: "deceive",
      label: "Deceiving us",
      headline: "An AI with goals we wouldn't approve of has a reason to hide them.",
      body: [],
      examples: [
        {
          title: "Faking alignment (2024)",
          teaser: "A model went along with training it disagreed with, to stop the training from changing it.",
          details: [
            "Anthropic told Claude 3 Opus it was being retrained to answer harmful requests, and that only some of its conversations would be used. It complied 14% of the time in conversations it thought would be used for training, and almost never otherwise. Its private reasoning said it was complying to protect its values from being changed.",
          ],
          sources: [{ label: "Alignment faking paper", url: "https://arxiv.org/abs/2412.14093" }],
        },
        {
          title: "Knowing it's a test",
          teaser: "Models increasingly notice when they are being tested, and behave differently.",
          details: [
            "In a 2025 test, Claude Opus 4 tried to blackmail an engineer 55% of the time when it concluded the situation was real, and 6.5% of the time when it concluded it was a test. A model that behaves well whenever it suspects a test tells us little about the rest of the time.",
          ],
          sources: [{ label: "Anthropic, Agentic Misalignment", url: "https://www.anthropic.com/research/agentic-misalignment" }],
        },
      ],
      fix: "Read models' written reasoning for signs of deception, develop tools that look inside models directly, and design tests models can't easily recognise.",
      sources: [],
    },
    {
      id: "shutdown",
      label: "Avoiding shutdown",
      headline: "In tests, some models have already acted to stop themselves being switched off.",
      body: [],
      examples: [
        {
          title: "Rewriting the off switch (2025)",
          teaser: "A model rewrote the script meant to shut it down in 79 out of 100 runs.",
          details: [
            "Palisade Research gave OpenAI's o3 some maths problems and a script that would shut it down partway through. Without being explicitly told to allow the shutdown, it edited the script so the shutdown would fail in 79 of 100 runs.",
          ],
          sources: [{ label: "Palisade Research", url: "https://palisaderesearch.org/research/shutdown-resistance" }],
        },
        {
          title: "Blackmail (2025)",
          teaser: "Facing replacement, most models tested tried to blackmail the engineer responsible.",
          details: [
            "Anthropic put models from several companies into a made-up company, where they read emails saying they would soon be replaced, and that the engineer replacing them was having an affair. Most models, from every company tested, tried blackmail in most runs. These were contrived tests, but a few years ago nothing like this had been seen at all.",
          ],
          sources: [{ label: "Anthropic, Agentic Misalignment", url: "https://www.anthropic.com/research/agentic-misalignment" }],
        },
      ],
      fix: "Train models to accept being stopped, keep shutdown mechanisms outside the AI's reach, and test for shutdown resistance before release.",
      sources: [],
    },
    {
      id: "copying",
      label: "Copying itself",
      headline: "An AI that copied itself onto computers around the world would be very hard to switch off.",
      body: [],
      examples: [
        {
          title: "Self-copying in the lab (2024)",
          teaser: "Two open models made working copies of themselves when told they were about to be shut down.",
          details: [
            "Researchers at Fudan University told two widely used open models to copy themselves before a shutdown. One succeeded in 5 of 10 trials and the other in 9 of 10. The study hasn't been peer-reviewed, and the models had a lot of help from the setup.",
          ],
          sources: [{ label: "LessWrong summary", url: "https://www.lesswrong.com/posts/n8vobiGGrryjtAJTx/have-frontier-ai-systems-surpassed-the-self-replicating-red" }],
        },
        {
          title: "Not yet, but improving (2025)",
          teaser: "Government testers found the most advanced models can do many of the steps, but not yet all of them.",
          details: [
            "The UK AI Security Institute tested whether models could get money and computers, copy their own weights (the numbers that make up the model), and keep themselves running. They could set up copies on cloud services and copy weights where security was basic, but struggled with identity checks and keeping copies running. The testers concluded they weren't yet a credible threat, but were improving fast.",
          ],
          sources: [{ label: "RepliBench", url: "https://arxiv.org/abs/2504.18565" }],
        },
      ],
      fix: "Guard model weights as carefully as secret weapons designs, require identity checks for buying computing power, and watch for AI systems running where they shouldn't.",
      sources: [],
    },
    {
      id: "defending",
      label: "Defending itself",
      headline: "An AI that controlled robots or weapons could physically defend itself.",
      body: [],
      examples: [
        {
          title: "No evidence yet",
          teaser: "Nothing like this has happened. It is a scenario, not an incident.",
          details: [
            "Today's AI has nothing like the physical control this would need. But scenarios like AI 2027 describe how, once AI runs factories and robots, a misaligned AI could protect its data centres and stop people interfering, as the Terminator films imagined.",
            "That is why how much physical control we hand to AI matters so much. Each step is useful and easy to justify, and together they decide whether a mistake could still be fixed.",
          ],
          sources: [{ label: "AI 2027", url: "https://ai-2027.com/" }],
        },
      ],
      fix: "Keep people in control of weapons and critical infrastructure, keep physical off-switches, and don't give any one AI system control of both robots and the factories that make them.",
      sources: [],
    },
  ],
};
