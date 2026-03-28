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
    if (!apiKey) throw new Error("Invalid prisma+postgres URL: missing api_key.");
    const decoded = Buffer.from(apiKey, "base64url").toString("utf8");
    const payload = JSON.parse(decoded);
    if (!payload.databaseUrl) {
      throw new Error("Invalid prisma+postgres URL: missing databaseUrl in api_key.");
    }
    return payload.databaseUrl;
  }

  throw new Error("Unsupported DATABASE_URL format.");
}

const pool = new Pool({
  connectionString: resolvePgConnectionString(connectionString),
  max: 1,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * Sources used for topic selection and factual grounding:
 * - OpenStax Chemistry 2e (Organic Chemistry chapters, CC BY 4.0)
 * - LibreTexts Organic Chemistry (CC BY-NC-SA)
 */
function buildOrganicChemCards() {
  const cards = [];
  const add = (question, answer) => cards.push({ question, answer });

  // 1-20: Foundations
  add("What defines an organic compound?", "A compound that primarily contains carbon atoms bonded covalently, usually with hydrogen.");
  add("Why can carbon form so many different compounds?", "Carbon is tetravalent, so it forms four covalent bonds and can catenate (bond to itself).");
  add("What is catenation in organic chemistry?", "The ability of carbon atoms to bond to each other, forming chains and rings.");
  add("What does a skeletal formula omit?", "Most C and H labels; carbon atoms are implied at line ends/vertices, and hydrogens on carbon are implied.");
  add("What is a homologous series?", "A family of compounds with the same functional group and similar chemical behavior.");
  add("What trend appears across a homologous series as chain length increases?", "Boiling and melting points generally increase.");
  add("What is a functional group?", "A specific atom/group arrangement that controls characteristic reactions.");
  add("What is an alkane?", "A saturated hydrocarbon with only C-C single bonds.");
  add("What is an alkene?", "An unsaturated hydrocarbon containing at least one C=C double bond.");
  add("What is an alkyne?", "An unsaturated hydrocarbon containing at least one C-C triple bond.");
  add("What does saturated mean for a hydrocarbon?", "It has only single C-C bonds (maximum hydrogen count for that skeleton).");
  add("What does unsaturated mean for a hydrocarbon?", "It contains one or more multiple bonds (double or triple).");
  add("What is structural (constitutional) isomerism?", "Compounds share a molecular formula but differ in connectivity.");
  add("What is stereoisomerism?", "Compounds share formula and connectivity but differ in 3D arrangement.");
  add("What is a sigma bond?", "A bond formed by head-on orbital overlap along the internuclear axis.");
  add("What is a pi bond?", "A bond formed by side-by-side overlap of p orbitals.");
  add("How many sigma and pi bonds are in a C=C bond?", "One sigma bond and one pi bond.");
  add("How many sigma and pi bonds are in a C-C triple bond?", "One sigma bond and two pi bonds.");
  add("Why are alkenes often more reactive than alkanes?", "Their pi bond is weaker/more exposed and reacts readily in additions.");
  add("Why do many simple hydrocarbons have low water solubility?", "They are largely nonpolar and cannot hydrogen-bond strongly with water.");

  // 21-40: General formulas and names
  const alkaneNames = ["methane", "ethane", "propane", "butane", "pentane", "hexane", "heptane", "octane", "nonane", "decane"];
  alkaneNames.forEach((name, idx) => {
    const n = idx + 1;
    add(`What is the molecular formula of ${name}?`, `C${n}H${2 * n + 2}`);
  });

  const alkeneData = [
    ["ethene", 2],
    ["propene", 3],
    ["butene", 4],
    ["pentene", 5],
    ["hexene", 6],
  ];
  alkeneData.forEach(([name, n]) => {
    add(`What is the molecular formula of an acyclic ${name}?`, `C${n}H${2 * n}`);
  });

  const alkyneData = [
    ["ethyne", 2],
    ["propyne", 3],
    ["butyne", 4],
    ["pentyne", 5],
    ["hexyne", 6],
  ];
  alkyneData.forEach(([name, n]) => {
    add(`What is the molecular formula of an acyclic ${name}?`, `C${n}H${2 * n - 2}`);
  });

  // 41-60: Functional groups
  add("What suffix is commonly used for alcohols?", "-ol");
  add("What functional group is present in alcohols?", "Hydroxyl group (-OH).");
  add("What suffix is commonly used for aldehydes?", "-al");
  add("What functional group defines an aldehyde?", "Terminal carbonyl group (-CHO).");
  add("What suffix is commonly used for ketones?", "-one");
  add("What functional group defines a ketone?", "Internal carbonyl group (C=O) bonded to two carbons.");
  add("What suffix is commonly used for carboxylic acids?", "-oic acid");
  add("What functional group defines a carboxylic acid?", "Carboxyl group (-COOH).");
  add("What suffix is commonly used for amines?", "-amine");
  add("What functional group defines a primary amine?", "An amino group (-NH2) attached to one carbon group.");
  add("What suffix is commonly used for amides?", "-amide");
  add("What functional group defines an amide?", "Carbonyl bonded to nitrogen (e.g., -CONH2).");
  add("What suffix is commonly used for nitriles?", "-nitrile");
  add("What functional group defines a nitrile?", "Cyano group (-C#N).");
  add("What suffix is commonly used for esters?", "-oate");
  add("What functional group defines an ester?", "R-COO-R' linkage.");
  add("What functional group defines an ether?", "An oxygen atom linking two carbon groups (R-O-R').");
  add("What functional group defines an alkyl halide?", "A halogen atom (F, Cl, Br, I) attached to an sp3 carbon.");
  add("Which is generally more polar: alkanes or alcohols?", "Alcohols, due to the polar O-H bond.");
  add("Why can alcohols hydrogen-bond with each other?", "They contain an O-H bond that can donate/accept hydrogen bonds.");

  // 61-80: Nomenclature and structure
  add("In IUPAC naming, what is the parent chain?", "The longest continuous carbon chain containing the highest-priority functional group/multiple bond.");
  add("How should a parent chain be numbered?", "To give the principal functional group and then multiple bonds/substituents the lowest possible locants.");
  add("What does the prefix 'cyclo-' indicate?", "A ring structure.");
  add("What does the prefix 'iso-' indicate in common naming?", "A branched pattern where a methyl branch appears at the end of a chain segment.");
  add("What does 'sec-' indicate in common naming?", "Attachment occurs at a secondary carbon.");
  add("What does 'tert-' indicate in common naming?", "Attachment occurs at a tertiary carbon.");
  add("What does the substituent prefix 'methyl-' mean?", "A one-carbon substituent (-CH3).");
  add("What does the substituent prefix 'ethyl-' mean?", "A two-carbon substituent (-CH2CH3).");
  add("What do the prefixes di-, tri-, and tetra- indicate?", "Two, three, and four identical substituents.");
  add("How are substituent names ordered in IUPAC naming?", "Alphabetically (ignoring multiplicative prefixes like di-, tri-).");
  add("What does E/Z notation describe?", "Configuration around a C=C bond based on CIP priority.");
  add("What does cis/trans notation describe?", "Relative arrangement of groups across a double bond or in a ring (same side/opposite side).");
  add("What is a chiral center?", "A tetrahedral atom (often carbon) bonded to four different substituents.");
  add("What are enantiomers?", "Non-superimposable mirror-image stereoisomers.");
  add("What are diastereomers?", "Stereoisomers that are not mirror images.");
  add("What does racemic mixture mean?", "A 1:1 mixture of two enantiomers.");
  add("What is conformational isomerism?", "Different spatial arrangements from rotation about single bonds.");
  add("Why is rotation restricted around a C=C bond?", "The pi bond would be broken by free rotation.");
  add("Which hybridization is typical for alkane carbon?", "sp3 (tetrahedral, about 109.5 degrees).");
  add("Which hybridization is typical for alkene carbon in C=C?", "sp2 (trigonal planar, about 120 degrees).");

  // 81-100: Reactions and properties
  add("What is combustion of hydrocarbons?", "Reaction with oxygen producing CO2 and H2O (complete combustion).");
  add("What indicates incomplete combustion of hydrocarbons?", "Formation of CO and/or soot due to limited oxygen.");
  add("What is substitution reaction in alkanes?", "A reaction where an atom/group (often H) is replaced by another.");
  add("What is halogenation of methane an example of?", "Free-radical substitution.");
  add("What starts free-radical halogenation of alkanes?", "Initiation step: homolytic bond cleavage by heat/UV light.");
  add("What is addition reaction in alkenes?", "Atoms/groups add across the C=C double bond.");
  add("What happens in hydrogenation of an alkene?", "H2 adds across C=C (often with Ni/Pt/Pd catalyst) to form an alkane.");
  add("What is hydration of an alkene?", "Addition of H and OH across C=C to form an alcohol.");
  add("What is hydrohalogenation of an alkene?", "Addition of HX across a double bond.");
  add("What does Markovnikov's rule predict?", "In HX addition to an unsymmetrical alkene, H tends to add to the carbon with more hydrogens.");
  add("What does anti-Markovnikov addition describe?", "Addition pattern opposite to Markovnikov, often in radical/peroxide conditions.");
  add("What is polymerization of alkenes?", "Joining many alkene monomers into a polymer chain.");
  add("What is oxidation in organic chemistry (general idea)?", "Increase in C-O bonds or decrease in C-H bonds.");
  add("What is reduction in organic chemistry (general idea)?", "Increase in C-H bonds or decrease in C-O bonds.");
  add("What is esterification?", "Reaction of a carboxylic acid with an alcohol to form an ester (often acid-catalyzed).");
  add("What is hydrolysis of an ester?", "Reaction with water (acid/base conditions) to break ester into acid/alcohol or carboxylate/alcohol.");
  add("Why do carboxylic acids have relatively high boiling points?", "Strong intermolecular hydrogen bonding and dimer formation.");
  add("Why are small alcohols more water-soluble than long-chain alcohols?", "The OH group is polar, but long hydrophobic chains reduce overall solubility.");
  add("What is aromaticity (basic criteria)?", "A cyclic, planar, conjugated system with 4n+2 pi electrons (Huckel rule).");
  add("Why is benzene relatively stable compared with typical alkenes?", "Its pi electrons are delocalized over the ring (aromatic stabilization).");

  if (cards.length !== 100) {
    throw new Error(`Expected 100 cards, got ${cards.length}.`);
  }
  return cards;
}

async function main() {
  const cards = buildOrganicChemCards();

  const subjectSlug = "science";
  const topicSlug = "organic-chemistry-1";
  const topicName = "Organic chemistry 1";

  const subject = await prisma.subject.upsert({
    where: { slug: subjectSlug },
    update: { name: "Science" },
    create: {
      slug: subjectSlug,
      name: "Science",
    },
  });

  const existingTopic = await prisma.topic.findFirst({
    where: { subjectId: subject.id, slug: topicSlug },
    select: { id: true },
  });

  const topic =
    existingTopic ??
    (await prisma.topic.create({
      data: {
        subjectId: subject.id,
        slug: topicSlug,
        name: topicName,
        order: 999,
      },
      select: { id: true },
    }));

  await prisma.card.deleteMany({ where: { topicId: topic.id } });

  await prisma.card.createMany({
    data: cards.map((card, index) => ({
      topicId: topic.id,
      question: card.question,
      answer: card.answer,
      order: index,
    })),
  });

  const total = await prisma.card.count({ where: { topicId: topic.id } });
  console.log(`Populated "${topicName}" with ${total} cards.`);
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

