import "dotenv/config";
import prismaPackage from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const { PrismaClient } = prismaPackage;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

function resolvePgConnectionString(url) {
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return url;
  }

  if (url.startsWith("prisma+postgres://")) {
    const parsed = new URL(url);
    const apiKey = parsed.searchParams.get("api_key");
    if (!apiKey) {
      throw new Error("Invalid prisma+postgres URL: missing api_key.");
    }

    const decoded = Buffer.from(apiKey, "base64url").toString("utf8");
    const payload = JSON.parse(decoded);
    if (!payload.databaseUrl) {
      throw new Error("Invalid prisma+postgres URL: missing databaseUrl in api_key.");
    }
    return payload.databaseUrl;
  }

  throw new Error("Unsupported DATABASE_URL format.");
}

const pgConnectionString = resolvePgConnectionString(connectionString);

const pool = new Pool({
  connectionString: pgConnectionString,
  max: 1,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });
const MAX_CARDS_PER_TOPIC = 300;

const data = [
  {
    slug: "math",
    name: "Math",
    topics: [
      {
        slug: "algebra",
        name: "Algebra Basics",
        cards: [
          { question: "What is the value of x in 2x + 4 = 14?", answer: "x = 5" },
          { question: "What is the slope in y = 3x - 2?", answer: "The slope is 3." },
          { question: "Simplify: 3(a + 2)", answer: "3a + 6" },
          { question: "Solve: x^2 = 49", answer: "x = 7 or x = -7" },
        ],
      },
      {
        slug: "geometry",
        name: "Geometry",
        cards: [
          {
            question: "What is the sum of interior angles in a triangle?",
            answer: "180 degrees",
          },
          { question: "Area formula for a rectangle?", answer: "Area = length x width" },
          {
            question: "A right triangle has sides 3 and 4. Hypotenuse?",
            answer: "5 (Pythagorean theorem)",
          },
        ],
      },
    ],
  },
  {
    slug: "science",
    name: "Science",
    topics: [
      {
        slug: "biology",
        name: "Biology",
        cards: [
          { question: "What is the powerhouse of the cell?", answer: "Mitochondria" },
          { question: "What carries genetic information?", answer: "DNA" },
          {
            question: "What process do plants use to make food?",
            answer: "Photosynthesis",
          },
        ],
      },
      {
        slug: "chemistry",
        name: "Chemistry",
        cards: [
          { question: "What is H2O commonly called?", answer: "Water" },
          { question: "What is the atomic number of Carbon?", answer: "6" },
          { question: "pH below 7 is considered?", answer: "Acidic" },
        ],
      },
    ],
  },
  {
    slug: "pre-pa-track",
    name: "Pre-PA Track",
    topics: [
      {
        slug: "biology-second-semester-core",
        name: "Biology Course - 2nd Semester (Core)",
        cards: [
          {
            question: "What is the main function of the nephron?",
            answer: "It filters blood and forms urine in the kidney.",
          },
          {
            question: "Where does gas exchange occur in the lungs?",
            answer: "In the alveoli.",
          },
          {
            question: "What chamber of the heart pumps oxygenated blood to the body?",
            answer: "The left ventricle.",
          },
          {
            question: "Which immune cells produce antibodies?",
            answer: "B lymphocytes (B cells).",
          },
          {
            question: "What is the role of the hypothalamus in homeostasis?",
            answer:
              "It regulates temperature, hunger, thirst, and endocrine control via the pituitary.",
          },
          {
            question: "What process moves water across a semipermeable membrane?",
            answer: "Osmosis.",
          },
          {
            question: "Name the phases of mitosis in order.",
            answer: "Prophase, Metaphase, Anaphase, Telophase.",
          },
          {
            question: "What does the SA node do?",
            answer: "It acts as the natural pacemaker of the heart.",
          },
          {
            question: "Which blood vessel type has the thickest walls?",
            answer: "Arteries.",
          },
          {
            question: "What is the primary function of hemoglobin?",
            answer: "To carry oxygen in red blood cells.",
          },
          {
            question: "How does negative feedback help in endocrine regulation?",
            answer:
              "It reduces hormone release when levels are high to maintain balance.",
          },
          {
            question: "Which part of the brain is most associated with coordination and balance?",
            answer: "The cerebellum.",
          },
          {
            question: "What molecule provides immediate energy currency in cells?",
            answer: "ATP (adenosine triphosphate).",
          },
          {
            question: "What organelle is responsible for protein synthesis?",
            answer: "Ribosomes.",
          },
          {
            question: "What is the function of the rough endoplasmic reticulum?",
            answer: "Synthesis and transport of proteins.",
          },
          {
            question: "What does the smooth endoplasmic reticulum mainly synthesize?",
            answer: "Lipids and steroid hormones.",
          },
          {
            question: "What organelle modifies and packages proteins?",
            answer: "Golgi apparatus.",
          },
          {
            question: "What is diffusion?",
            answer: "Movement of molecules from high to low concentration.",
          },
          {
            question: "What is active transport?",
            answer: "Movement across a membrane using ATP, often against a gradient.",
          },
          {
            question: "What is the function of lysosomes?",
            answer: "Intracellular digestion and recycling of cellular waste.",
          },
          {
            question: "What are enzymes?",
            answer: "Biological catalysts that speed up chemical reactions.",
          },
          {
            question: "What does denaturation do to enzymes?",
            answer: "It alters shape and reduces or destroys function.",
          },
          {
            question: "What is the role of the cell membrane?",
            answer: "Selective barrier controlling what enters and leaves the cell.",
          },
          {
            question: "Which transport process uses vesicles to move materials out of the cell?",
            answer: "Exocytosis.",
          },
          {
            question: "What process brings large particles into a cell?",
            answer: "Endocytosis.",
          },
          {
            question: "Which macromolecule stores genetic information?",
            answer: "Nucleic acids (DNA/RNA).",
          },
          {
            question: "What is the monomer of proteins?",
            answer: "Amino acids.",
          },
          {
            question: "What is a tissue?",
            answer: "A group of similar cells performing a specific function.",
          },
          {
            question: "Name the four major tissue types.",
            answer: "Epithelial, connective, muscle, and nervous tissue.",
          },
          {
            question: "What is homeostasis?",
            answer: "Maintenance of a stable internal environment.",
          },
          {
            question: "What is the function of epithelial tissue?",
            answer: "Protection, secretion, and absorption.",
          },
          {
            question: "What are tight junctions?",
            answer: "Cell junctions that prevent leakage between neighboring cells.",
          },
          {
            question: "What is the role of connective tissue?",
            answer: "Support, binding, transport, and storage.",
          },
          {
            question: "What are stem cells?",
            answer: "Undifferentiated cells that can self-renew and specialize.",
          },
          {
            question: "What is apoptosis?",
            answer: "Programmed cell death.",
          },
          {
            question: "What is the main purpose of checkpoints in the cell cycle?",
            answer: "To ensure DNA integrity and proper progression of division.",
          },
          {
            question: "What is cytokinesis?",
            answer: "Division of the cytoplasm to form daughter cells.",
          },
          {
            question: "What is a chromosome?",
            answer: "A DNA-protein structure carrying genes.",
          },
          {
            question: "How many chromosomes are in a typical human somatic cell?",
            answer: "46 chromosomes.",
          },
          {
            question: "What is a gene?",
            answer: "A segment of DNA that encodes a functional product.",
          },
          {
            question: "What is transcription?",
            answer: "Synthesis of RNA from a DNA template.",
          },
          {
            question: "What is translation?",
            answer: "Protein synthesis from mRNA at ribosomes.",
          },
        ],
      },
      {
        slug: "biology-second-semester-physiology",
        name: "Biology Course - 2nd Semester (Physiology)",
        cards: [
          {
            question: "What is the function of the right ventricle?",
            answer: "To pump deoxygenated blood to the lungs.",
          },
          {
            question: "What vessel returns oxygenated blood from lungs to heart?",
            answer: "Pulmonary veins.",
          },
          {
            question: "What is systole?",
            answer: "Phase of cardiac contraction and blood ejection.",
          },
          {
            question: "What is diastole?",
            answer: "Phase of cardiac relaxation and filling.",
          },
          {
            question: "What is blood pressure?",
            answer: "Force exerted by blood on arterial walls.",
          },
          {
            question: "What is the major function of red blood cells?",
            answer: "Transport oxygen using hemoglobin.",
          },
          {
            question: "What is the role of platelets?",
            answer: "Initiation of blood clotting.",
          },
          {
            question: "What are the primary sites of gas exchange in the respiratory system?",
            answer: "Alveolar-capillary membranes in the lungs.",
          },
          {
            question: "What muscle is the main driver of quiet inspiration?",
            answer: "The diaphragm.",
          },
          {
            question: "What is tidal volume?",
            answer: "Air volume inhaled or exhaled during a normal breath.",
          },
          {
            question: "What is the role of surfactant in alveoli?",
            answer: "Reduces surface tension and prevents alveolar collapse.",
          },
          {
            question: "Where does most nutrient absorption occur?",
            answer: "Small intestine.",
          },
          {
            question: "What is the function of villi and microvilli?",
            answer: "Increase intestinal surface area for absorption.",
          },
          {
            question: "What is the liver's role in metabolism?",
            answer: "Processes nutrients, detoxifies, and produces bile.",
          },
          {
            question: "What is the main function of the pancreas in digestion?",
            answer: "Secretion of digestive enzymes and bicarbonate.",
          },
          {
            question: "What hormone lowers blood glucose levels?",
            answer: "Insulin.",
          },
          {
            question: "What hormone raises blood glucose levels?",
            answer: "Glucagon.",
          },
          {
            question: "What part of the nephron reabsorbs most filtrate?",
            answer: "Proximal convoluted tubule.",
          },
          {
            question: "What is glomerular filtration?",
            answer: "Movement of plasma from glomerular capillaries into Bowman's capsule.",
          },
          {
            question: "What is the role of ADH in the kidneys?",
            answer: "Increases water reabsorption in collecting ducts.",
          },
          {
            question: "What does aldosterone primarily regulate?",
            answer: "Sodium reabsorption and potassium secretion.",
          },
          {
            question: "What is the function of the loop of Henle?",
            answer: "Creates a concentration gradient for urine concentration.",
          },
          {
            question: "What is the role of the hypothalamus-pituitary axis?",
            answer: "Central regulation of endocrine gland function.",
          },
          {
            question: "What gland secretes thyroid hormone?",
            answer: "Thyroid gland.",
          },
          {
            question: "What is the effect of thyroid hormone on metabolism?",
            answer: "Increases basal metabolic rate.",
          },
          {
            question: "What do cortisol and other glucocorticoids generally do?",
            answer: "Support stress response and increase glucose availability.",
          },
          {
            question: "What is a reflex arc?",
            answer: "Neural pathway mediating automatic responses.",
          },
          {
            question: "What neurotransmitter is released at the neuromuscular junction?",
            answer: "Acetylcholine.",
          },
          {
            question: "What is the function of myelin?",
            answer: "Insulates axons and increases conduction speed.",
          },
          {
            question: "What is the role of the cerebrum?",
            answer: "Higher cognitive functions, sensory integration, and voluntary movement.",
          },
        ],
      },
      {
        slug: "biology-second-semester-genetics",
        name: "Biology Course - 2nd Semester (Genetics & Evolution)",
        cards: [
          {
            question: "What is a dominant allele?",
            answer: "An allele expressed in the phenotype when at least one copy is present.",
          },
          {
            question: "What is a recessive allele?",
            answer: "An allele expressed only when two copies are present.",
          },
          {
            question: "What is genotype?",
            answer: "The genetic makeup of an organism.",
          },
          {
            question: "What is phenotype?",
            answer: "Observable traits resulting from genotype and environment.",
          },
          {
            question: "What is homozygous?",
            answer: "Having two identical alleles for a gene.",
          },
          {
            question: "What is heterozygous?",
            answer: "Having two different alleles for a gene.",
          },
          {
            question: "What law states allele pairs separate during gamete formation?",
            answer: "Mendel's law of segregation.",
          },
          {
            question: "What law states genes on different chromosomes assort independently?",
            answer: "Mendel's law of independent assortment.",
          },
          {
            question: "What is crossing over?",
            answer: "Exchange of DNA between homologous chromosomes in meiosis I.",
          },
          {
            question: "What is meiosis?",
            answer: "Cell division producing haploid gametes.",
          },
          {
            question: "How many chromosomes are in a human gamete?",
            answer: "23 chromosomes.",
          },
          {
            question: "What is nondisjunction?",
            answer: "Failure of chromosomes to separate properly during meiosis.",
          },
          {
            question: "What is a mutation?",
            answer: "A change in DNA sequence.",
          },
          {
            question: "What is a point mutation?",
            answer: "A change affecting a single nucleotide.",
          },
          {
            question: "What is a frameshift mutation?",
            answer: "Insertion/deletion not in multiples of three that shifts codon reading frame.",
          },
          {
            question: "What is gene expression?",
            answer: "Process of using genetic information to make RNA/protein products.",
          },
          {
            question: "What is an operon?",
            answer: "A cluster of genes regulated together in prokaryotes.",
          },
          {
            question: "What is epigenetics?",
            answer: "Heritable changes in gene activity without DNA sequence change.",
          },
          {
            question: "What is natural selection?",
            answer: "Differential survival and reproduction of individuals with favorable traits.",
          },
          {
            question: "What is adaptation in evolution?",
            answer: "A trait that improves survival or reproduction in an environment.",
          },
          {
            question: "What is genetic drift?",
            answer: "Random changes in allele frequency, strongest in small populations.",
          },
          {
            question: "What is gene flow?",
            answer: "Movement of alleles between populations through migration.",
          },
          {
            question: "What is speciation?",
            answer: "Formation of new species from ancestral populations.",
          },
          {
            question: "What is reproductive isolation?",
            answer: "Barriers preventing successful interbreeding between populations.",
          },
          {
            question: "What does Hardy-Weinberg equilibrium describe?",
            answer: "A non-evolving population with constant allele frequencies.",
          },
          {
            question: "Name one condition for Hardy-Weinberg equilibrium.",
            answer: "No selection, mutation, migration, drift, or non-random mating.",
          },
          {
            question: "What is homologous structure evidence for?",
            answer: "Common ancestry.",
          },
          {
            question: "What is convergent evolution?",
            answer: "Independent evolution of similar traits in unrelated lineages.",
          },
          {
            question: "What is cladistics used for?",
            answer: "Classifying organisms by shared derived characteristics.",
          },
          {
            question: "What does PCR do in molecular biology?",
            answer: "Amplifies specific DNA sequences.",
          },
        ],
      },
    ],
  },
];

function validateInput() {
  for (const subject of data) {
    for (const topic of subject.topics) {
      if (topic.cards.length > MAX_CARDS_PER_TOPIC) {
        throw new Error(
          `Topic "${topic.name}" exceeds ${MAX_CARDS_PER_TOPIC} cards.`
        );
      }
    }
  }
}

async function main() {
  validateInput();

  await prisma.card.deleteMany();
  await prisma.topicProgress.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.subject.deleteMany();

  for (const subjectData of data) {
    const subject = await prisma.subject.create({
      data: {
        slug: subjectData.slug,
        name: subjectData.name,
      },
    });

    for (const [topicIndex, topicData] of subjectData.topics.entries()) {
      const topic = await prisma.topic.create({
        data: {
          slug: topicData.slug,
          name: topicData.name,
          order: topicIndex,
          subjectId: subject.id,
        },
      });

      for (const [cardIndex, card] of topicData.cards.entries()) {
        await prisma.card.create({
          data: {
            question: card.question,
            answer: card.answer,
            order: cardIndex,
            topicId: topic.id,
          },
        });
      }
    }
  }
}

main()
  .then(async () => {
    await pool.end();
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    await prisma.$disconnect();
    process.exit(1);
  });
