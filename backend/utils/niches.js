// Single source of truth for the platform's niche taxonomy — 9 categories,
// each with several niches, each with several sub-niches (client-provided
// list, added 2026-08-08, replacing the old flat 28-niche list).
//
// Categories are a display/grouping concept only — profiles, campaigns and
// brand industry all store at the NICHE level (like before), plus an optional
// subNiches array for finer tagging. See frontend/lib/niches.ts for the mirror.

const NICHE_TAXONOMY = [
  {
    slug: "business-wealth-and-personal-finance",
    label: "Business, Wealth & Personal Finance",
    niches: [
      {
        slug: "personal-finance-and-budgeting",
        label: "Personal Finance & Budgeting",
        subNiches: [{ slug: "debt-free-journeys", label: "Debt-free journeys" }, { slug: "fire-financial-independence-retire-early", label: "FIRE (Financial Independence, Retire Early)" }, { slug: "zero-based-budgeting", label: "Zero-based budgeting" }, { slug: "credit-card-rewards-and-points-hacking", label: "Credit card rewards & points hacking" }, { slug: "frugal-living", label: "Frugal living" }],
      },
      {
        slug: "investing-and-wealth-building",
        label: "Investing & Wealth Building",
        subNiches: [{ slug: "dividend-stock-investing", label: "Dividend stock investing" }, { slug: "mutual-funds-and-etfs-for-beginners", label: "Mutual funds & ETFs for beginners" }, { slug: "option-trading-breakdowns", label: "Option trading breakdowns" }, { slug: "crypto-and-defi-education", label: "Crypto & DeFi education" }, { slug: "real-estate-syndications", label: "Real estate syndications" }],
      },
      {
        slug: "entrepreneurship-and-startups",
        label: "Entrepreneurship & Startups",
        subNiches: [{ slug: "solo-founder-bootstrapping", label: "Solo-founder bootstrapping" }, { slug: "saas-building-in-public", label: "SaaS building in public" }, { slug: "e-commerce-branding", label: "E-commerce branding" }, { slug: "franchise-ownership", label: "Franchise ownership" }, { slug: "agency-scaling", label: "Agency scaling" }],
      },
      {
        slug: "real-estate-and-property",
        label: "Real Estate & Property",
        subNiches: [{ slug: "house-flipping", label: "House flipping" }, { slug: "airbnb-and-short-term-rental-arbitrage", label: "Airbnb & short-term rental arbitrage" }, { slug: "first-time-homebuyer-coaching", label: "First-time homebuyer coaching" }, { slug: "commercial-real-estate-analysis", label: "Commercial real estate analysis" }, { slug: "tiny-home-developments", label: "Tiny home developments" }],
      },
      {
        slug: "side-hustles-and-freelancing",
        label: "Side Hustles & Freelancing",
        subNiches: [{ slug: "high-ticket-copywriting", label: "High-ticket copywriting" }, { slug: "virtual-assistant-scaling", label: "Virtual assistant scaling" }, { slug: "print-on-demand-stores", label: "Print-on-demand stores" }, { slug: "digital-product-sales", label: "Digital product sales" }, { slug: "ugc-creator-advice", label: "UGC creator advice" }],
      },
    ],
  },
  {
    slug: "tech-ai-and-software-ecosystems",
    label: "Tech, AI & Software Ecosystems",
    niches: [
      {
        slug: "artificial-intelligence-and-automation",
        label: "Artificial Intelligence & Automation",
        subNiches: [{ slug: "prompt-engineering-tutorials", label: "Prompt engineering tutorials" }, { slug: "no-code-ai-workflow-building", label: "No-code AI workflow building" }, { slug: "llm-comparisons", label: "LLM comparisons" }, { slug: "ai-art-generation", label: "AI art generation" }, { slug: "ai-tools-for-specific-professions", label: "AI tools for specific professions" }],
      },
      {
        slug: "software-and-coding",
        label: "Software & Coding",
        subNiches: [{ slug: "frontend-web-dev-tips", label: "Frontend web dev tips" }, { slug: "cybersecurity-awareness", label: "Cybersecurity awareness" }, { slug: "game-development", label: "Game development" }, { slug: "devops-breakdowns", label: "DevOps breakdowns" }, { slug: "day-in-the-life-of-a-software-engineer", label: "Day in the life of a software engineer" }, { slug: "open-source-software-reviews", label: "Open-source software reviews" }],
      },
      {
        slug: "consumer-electronics-and-hardware",
        label: "Consumer Electronics & Hardware",
        subNiches: [{ slug: "budget-smartphone-comparisons", label: "Budget smartphone comparisons" }, { slug: "custom-mechanical-keyboard-building", label: "Custom mechanical keyboard building" }, { slug: "pc-rig-building", label: "PC rig building" }, { slug: "camera-and-lens-gear-testing", label: "Camera & lens gear testing" }, { slug: "smart-home-automation-setups", label: "Smart home automation setups" }],
      },
      {
        slug: "digital-productivity",
        label: "Digital Productivity",
        subNiches: [{ slug: "obsidian-and-notion-workspace-engineering", label: "Obsidian & Notion workspace engineering" }, { slug: "ipad-paperless-study-setups", label: "iPad paperless study setups" }, { slug: "gtd-system-tutorials", label: "GTD system tutorials" }, { slug: "remote-work-tech-setups", label: "Remote work tech setups" }],
      },
    ],
  },
  {
    slug: "health-wellness-and-physical-performance",
    label: "Health, Wellness & Physical Performance",
    niches: [
      {
        slug: "gym-training-and-strength",
        label: "Gym Training & Strength",
        subNiches: [{ slug: "powerlifting-technique", label: "Powerlifting technique" }, { slug: "calisthenics-and-bodyweight-mastery", label: "Calisthenics & bodyweight mastery" }, { slug: "kettlebell-functional-training", label: "Kettlebell functional training" }, { slug: "hypertrophy-and-bodybuilding", label: "Hypertrophy & bodybuilding" }, { slug: "gym-humor-and-skits", label: "Gym humor & skits" }],
      },
      {
        slug: "endurance-and-specialty-sports",
        label: "Endurance & Specialty Sports",
        subNiches: [{ slug: "marathon-and-ultramarathon-prep", label: "Marathon & ultramarathon prep" }, { slug: "gravel-and-road-cycling", label: "Gravel & road cycling" }, { slug: "bouldering-and-rock-climbing-technique", label: "Bouldering & rock climbing technique" }, { slug: "combat-sports-conditioning", label: "Combat sports conditioning" }],
      },
      {
        slug: "holistic-wellness-and-biohacking",
        label: "Holistic Wellness & Biohacking",
        subNiches: [{ slug: "cold-water-immersion-and-ice-baths", label: "Cold-water immersion & ice baths" }, { slug: "sauna-and-heat-therapy-protocols", label: "Sauna & heat therapy protocols" }, { slug: "circadian-rhythm-and-sleep-optimization", label: "Circadian rhythm & sleep optimization" }, { slug: "breathwork-practices", label: "Breathwork practices" }, { slug: "longevity-research", label: "Longevity research" }],
      },
      {
        slug: "nutrition-and-specialized-diets",
        label: "Nutrition & Specialized Diets",
        subNiches: [{ slug: "high-protein-budget-meal-prep", label: "High-protein budget meal prep" }, { slug: "carnivore-and-animal-based-living", label: "Carnivore & animal-based living" }, { slug: "plant-based-and-vegan-athlete-nutrition", label: "Plant-based & vegan athlete nutrition" }, { slug: "gut-microbiome-health", label: "Gut microbiome health" }, { slug: "gluten-free-and-celiac-cooking", label: "Gluten-free & celiac cooking" }],
      },
      {
        slug: "mental-health-and-psychology",
        label: "Mental Health & Psychology",
        subNiches: [{ slug: "adhd-productivity-hacks", label: "ADHD productivity hacks" }, { slug: "anxiety-regulation-techniques", label: "Anxiety regulation techniques" }, { slug: "cbt-and-dbt-concepts-explained", label: "CBT & DBT concepts explained" }, { slug: "gentle-somatic-therapy-exercises", label: "Gentle somatic therapy exercises" }, { slug: "burnout-recovery-for-professionals", label: "Burnout recovery for professionals" }],
      },
    ],
  },
  {
    slug: "lifestyle-fashion-and-personal-care",
    label: "Lifestyle, Fashion & Personal Care",
    niches: [
      {
        slug: "beauty-makeup-and-aesthetics",
        label: "Beauty, Makeup & Aesthetics",
        subNiches: [{ slug: "skincare-ingredient-science", label: "Skincare ingredient science" }, { slug: "acne-and-hyperpigmentation-treatment-journeys", label: "Acne & hyperpigmentation treatment journeys" }, { slug: "drugstore-vs-luxury-makeup-dupes", label: "Drugstore vs luxury makeup dupes" }, { slug: "korean-and-j-beauty-routines", label: "Korean & J-beauty routines" }, { slug: "textured-hair-and-curl-care", label: "Textured hair & curl care" }],
      },
      {
        slug: "fashion-and-styling",
        label: "Fashion & Styling",
        subNiches: [{ slug: "thrift-flipping-and-upcycling", label: "Thrift-flipping & upcycling" }, { slug: "capsule-wardrobe-building", label: "Capsule wardrobe building" }, { slug: "streetwear-and-sneaker-culture", label: "Streetwear & sneaker culture" }, { slug: "plus-size-styling", label: "Plus-size styling" }, { slug: "modest-fashion", label: "Modest fashion" }, { slug: "classic-menswear-and-watch-collecting", label: "Classic menswear & watch collecting" }],
      },
      {
        slug: "daily-vlogging-and-aesthetic-living",
        label: "Daily Vlogging & Aesthetic Living",
        subNiches: [{ slug: "silent-cozy-living-vlogs", label: "Silent cozy living vlogs" }, { slug: "romanticizing-daily-routines", label: "Romanticizing daily routines" }, { slug: "asmr-morning-and-night-routines", label: "ASMR morning & night routines" }, { slug: "rural-cottagecore-lifestyle", label: "Rural cottagecore lifestyle" }, { slug: "luxury-and-high-end-lifestyle", label: "Luxury & high-end lifestyle" }],
      },
      {
        slug: "home-decor-and-interior-styling",
        label: "Home Decor & Interior Styling",
        subNiches: [{ slug: "rental-friendly-apartment-hacks", label: "Rental-friendly apartment hacks" }, { slug: "mid-century-modern-curation", label: "Mid-century modern curation" }, { slug: "diy-furniture-restoration", label: "DIY furniture restoration" }, { slug: "small-space-and-studio-organization", label: "Small-space & studio organization" }, { slug: "maximalist-decor", label: "Maximalist decor" }],
      },
      {
        slug: "parenting-and-family-dynamics",
        label: "Parenting & Family Dynamics",
        subNiches: [{ slug: "gentle-and-respectful-parenting-tips", label: "Gentle & respectful parenting tips" }, { slug: "montessori-home-setups-for-toddlers", label: "Montessori home setups for toddlers" }, { slug: "newborn-sleep-routines", label: "Newborn sleep routines" }, { slug: "homeschooling-curriculums", label: "Homeschooling curriculums" }, { slug: "dad-humor-and-parenting-survival", label: "Dad humor & parenting survival" }],
      },
    ],
  },
  {
    slug: "food-beverage-and-culinary-arts",
    label: "Food, Beverage & Culinary Arts",
    niches: [
      {
        slug: "everyday-and-budget-cooking",
        label: "Everyday & Budget Cooking",
        subNiches: [{ slug: "15-minute-weeknight-dinners", label: "15-minute weeknight dinners" }, { slug: "5-ingredient-recipes", label: "5-ingredient recipes" }, { slug: "budget-grocery-hauls-and-meal-plans", label: "Budget grocery hauls & meal plans" }, { slug: "dorm-room-single-pan-cooking", label: "Dorm-room single-pan cooking" }],
      },
      {
        slug: "baking-and-pastry",
        label: "Baking & Pastry",
        subNiches: [{ slug: "sourdough-starter-maintenance-and-baking", label: "Sourdough starter maintenance & baking" }, { slug: "cake-decorating-and-piping-art", label: "Cake decorating & piping art" }, { slug: "french-pastry-tutorials", label: "French pastry tutorials" }, { slug: "allergy-friendly-baking", label: "Allergy-friendly baking" }],
      },
      {
        slug: "specialty-beverage-and-mixology",
        label: "Specialty Beverage & Mixology",
        subNiches: [{ slug: "espresso-machine-dialing-in-and-latte-art", label: "Espresso machine dialing-in & latte art" }, { slug: "ceremonial-matcha-preparation", label: "Ceremonial matcha preparation" }, { slug: "artisanal-mocktails-and-functional-beverages", label: "Artisanal mocktails & functional beverages" }, { slug: "craft-cocktail-mixology", label: "Craft cocktail mixology" }],
      },
      {
        slug: "food-discovery-and-criticism",
        label: "Food Discovery & Criticism",
        subNiches: [{ slug: "street-food-tours", label: "Street food tours" }, { slug: "asmr-eating-mukbang", label: "ASMR eating (Mukbang)" }, { slug: "local-hidden-gem-restaurant-reviews", label: "Local hidden-gem restaurant reviews" }, { slug: "fast-food-taste-tests-and-menu-hacks", label: "Fast-food taste tests & menu hacks" }],
      },
    ],
  },
  {
    slug: "travel-adventure-and-nomadic-living",
    label: "Travel, Adventure & Nomadic Living",
    niches: [
      {
        slug: "budget-and-adventure-travel",
        label: "Budget & Adventure Travel",
        subNiches: [{ slug: "flight-points-and-miles-hacking", label: "Flight points & miles hacking" }, { slug: "hostel-backpacking-guides", label: "Hostel backpacking guides" }, { slug: "ultralight-one-bag-packing", label: "Ultralight one-bag packing" }, { slug: "solo-female-travel-safety", label: "Solo female travel safety" }],
      },
      {
        slug: "mobile-living-and-nomadic-lifestyles",
        label: "Mobile Living & Nomadic Lifestyles",
        subNiches: [{ slug: "vanlife-diy-build-tutorials", label: "Vanlife DIY build tutorials" }, { slug: "boondocking-and-off-grid-camping-guides", label: "Boondocking & off-grid camping guides" }, { slug: "digital-nomad-visa-breakdowns", label: "Digital nomad visa breakdowns" }, { slug: "full-time-rv-family-living", label: "Full-time RV family living" }],
      },
      {
        slug: "specialty-and-luxury-tourism",
        label: "Specialty & Luxury Tourism",
        subNiches: [{ slug: "first-class-and-luxury-resort-reviews", label: "First-class & luxury resort reviews" }, { slug: "eco-tourism-and-sustainable-travel", label: "Eco-tourism & sustainable travel" }, { slug: "hyper-local-weekend-getaway-itineraries", label: "Hyper-local weekend getaway itineraries" }, { slug: "historical-architecture-tours", label: "Historical architecture tours" }],
      },
    ],
  },
  {
    slug: "entertainment-humor-and-pop-culture",
    label: "Entertainment, Humor & Pop Culture",
    niches: [
      {
        slug: "comedy-and-relatable-satire",
        label: "Comedy & Relatable Satire",
        subNiches: [{ slug: "corporate-and-office-life-satire", label: "Corporate & office life satire" }, { slug: "regional-and-cultural-family-humor", label: "Regional & cultural family humor" }, { slug: "character-impersonations", label: "Character impersonations" }, { slug: "relationship-skits", label: "Relationship skits" }],
      },
      {
        slug: "pop-culture-and-media-commentary",
        label: "Pop Culture & Media Commentary",
        subNiches: [{ slug: "film-and-tv-easter-eggs", label: "Film & TV Easter eggs" }, { slug: "celebrity-legal-and-pr-breakdowns", label: "Celebrity legal & PR breakdowns" }, { slug: "reality-tv-analysis", label: "Reality TV analysis" }, { slug: "book-reviews-bookstagram", label: "Book reviews (Bookstagram)" }, { slug: "music-production-and-sampling-breakdowns", label: "Music production & sampling breakdowns" }],
      },
      {
        slug: "gaming-ecosystem",
        label: "Gaming Ecosystem",
        subNiches: [{ slug: "cozy-gaming", label: "Cozy gaming" }, { slug: "speedrunning-highlights", label: "Speedrunning highlights" }, { slug: "competitive-esports-analysis", label: "Competitive esports analysis" }, { slug: "tabletop-rpg-lore-and-painting", label: "Tabletop RPG lore & painting" }],
      },
    ],
  },
  {
    slug: "occupational-professional-and-identity-communities",
    label: "Occupational, Professional & Identity Communities",
    niches: [
      {
        slug: "healthcare-workers",
        label: "Healthcare Workers",
        subNiches: [{ slug: "er-and-icu-nurse-shift-humor", label: "ER & ICU nurse shift humor" }, { slug: "medical-student-study-survival", label: "Medical student study survival" }, { slug: "veterinary-medicine-behind-the-scenes", label: "Veterinary medicine behind-the-scenes" }, { slug: "pharmacist-tips", label: "Pharmacist tips" }],
      },
      {
        slug: "educators-and-teachers",
        label: "Educators & Teachers",
        subNiches: [{ slug: "elementary-classroom-management", label: "Elementary classroom management" }, { slug: "stem-teacher-lab-experiments", label: "STEM teacher lab experiments" }, { slug: "special-education-resource-creation", label: "Special education resource creation" }, { slug: "teacher-humor", label: "Teacher humor" }],
      },
      {
        slug: "skilled-trades-and-logistics",
        label: "Skilled Trades & Logistics",
        subNiches: [{ slug: "electrician-wiring-tutorials", label: "Electrician wiring tutorials" }, { slug: "carpentry-and-woodworking-projects", label: "Carpentry & woodworking projects" }, { slug: "long-haul-trucking-lifestyle-and-routing", label: "Long-haul trucking lifestyle & routing" }, { slug: "firefighter-station-culture", label: "Firefighter station culture" }],
      },
      {
        slug: "legal-and-corporate-professionals",
        label: "Legal & Corporate Professionals",
        subNiches: [{ slug: "hr-rights-and-resume-optimization", label: "HR rights & resume optimization" }, { slug: "corporate-lawyer-life", label: "Corporate lawyer life" }, { slug: "salary-negotiation-scripting", label: "Salary negotiation scripting" }, { slug: "accounting-and-tax-humor", label: "Accounting & tax humor" }],
      },
    ],
  },
  {
    slug: "education-science-and-highly-specialized-hobbies",
    label: "Education, Science & Highly Specialized Hobbies",
    niches: [
      {
        slug: "science-history-and-humanities",
        label: "Science, History & Humanities",
        subNiches: [{ slug: "astrophysics-and-space-exploration-explained", label: "Astrophysics & space exploration explained" }, { slug: "visual-history-timelines", label: "Visual history timelines" }, { slug: "philosophical-concepts-applied-to-daily-life", label: "Philosophical concepts applied to daily life" }, { slug: "archaeology-discoveries", label: "Archaeology discoveries" }],
      },
      {
        slug: "visual-arts-and-crafting",
        label: "Visual Arts & Crafting",
        subNiches: [{ slug: "digital-illustration", label: "Digital illustration" }, { slug: "wheel-thrown-pottery-and-glazing", label: "Wheel-thrown pottery & glazing" }, { slug: "rug-tufting-and-embroidery", label: "Rug tufting & embroidery" }, { slug: "tattoo-flash-art-and-culture", label: "Tattoo flash art & culture" }],
      },
      {
        slug: "agriculture-plants-and-homesteading",
        label: "Agriculture, Plants & Homesteading",
        subNiches: [{ slug: "urban-balcony-gardening", label: "Urban balcony gardening" }, { slug: "indoor-houseplant-propagation-and-pest-care", label: "Indoor houseplant propagation & pest care" }, { slug: "backyard-poultry-and-chicken-keeping", label: "Backyard poultry & chicken keeping" }, { slug: "gourmet-mushroom-farming", label: "Gourmet mushroom farming" }, { slug: "permaculture-soil-science", label: "Permaculture soil science" }],
      },
      {
        slug: "pet-and-animal-care",
        label: "Pet & Animal Care",
        subNiches: [{ slug: "breed-specific-dog-training", label: "Breed-specific dog training" }, { slug: "reptile-and-amphibian-terrarium-keeping", label: "Reptile & amphibian terrarium keeping" }, { slug: "aquascaping-and-planted-fish-tanks", label: "Aquascaping & planted fish tanks" }, { slug: "cat-enrichment-and-behavioral-psychology", label: "Cat enrichment & behavioral psychology" }],
      },
      {
        slug: "automotive-and-mechanical",
        label: "Automotive & Mechanical",
        subNiches: [{ slug: "asmr-auto-detailing", label: "ASMR auto detailing" }, { slug: "jdm-and-project-car-restorations", label: "JDM & project car restorations" }, { slug: "motorcycle-riding-and-maintenance", label: "Motorcycle riding & maintenance" }, { slug: "ev-technology-reviews", label: "EV technology reviews" }],
      },
    ],
  },
];

const NICHE_CATEGORIES = NICHE_TAXONOMY.map(c => ({ slug: c.slug, label: c.label }));

const NICHES = NICHE_TAXONOMY.flatMap(c => c.niches.map(n => n.slug));

const NICHE_LABELS = Object.fromEntries(
  NICHE_TAXONOMY.flatMap(c => c.niches.map(n => [n.slug, n.label]))
);

const NICHE_CATEGORY = Object.fromEntries(
  NICHE_TAXONOMY.flatMap(c => c.niches.map(n => [n.slug, c.slug]))
);

const SUB_NICHES = NICHE_TAXONOMY.flatMap(c => c.niches.flatMap(n => n.subNiches.map(s => s.slug)));

const SUB_NICHE_LABELS = Object.fromEntries(
  NICHE_TAXONOMY.flatMap(c => c.niches.flatMap(n => n.subNiches.map(s => [s.slug, s.label])))
);

const SUB_NICHE_TO_NICHE = Object.fromEntries(
  NICHE_TAXONOMY.flatMap(c => c.niches.flatMap(n => n.subNiches.map(s => [s.slug, n.slug])))
);

const NICHE_SUBNICHES = Object.fromEntries(
  NICHE_TAXONOMY.flatMap(c => c.niches.map(n => [n.slug, n.subNiches.map(s => s.slug)]))
);

module.exports = {
  NICHE_TAXONOMY,
  NICHE_CATEGORIES,
  NICHES,
  NICHE_LABELS,
  NICHE_CATEGORY,
  SUB_NICHES,
  SUB_NICHE_LABELS,
  SUB_NICHE_TO_NICHE,
  NICHE_SUBNICHES,
};
