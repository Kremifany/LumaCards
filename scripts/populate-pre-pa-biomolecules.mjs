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
 * - OpenStax Biology 2e (Ch. 2–4: Chemical Foundations, Macromolecules, Cells), CC BY 4.0
 * - OpenStax Biology 2e (Ch. 9–10, 14: Cell Communication, Cell Cycle, DNA Structure & Function), CC BY 4.0
 * - OpenStax Concepts of Biology (Biological Molecules, Cells, Genetics), CC BY 4.0
 */
function buildBiomoleculesCellsGenomesCards() {
  const cards = [];
  const add = (question, answer) => cards.push({ question, answer });

  // 1–20: Atoms, bonds, water
  add("What four elements make up most of the mass of living organisms?", "Carbon, hydrogen, oxygen, and nitrogen.");
  add("What is an atom?", "The smallest unit of matter that retains the properties of an element.");
  add("What three subatomic particles make up most atoms?", "Protons, neutrons, and electrons.");
  add("What is the charge and location of a proton?", "Positive charge, located in the atomic nucleus.");
  add("What is the charge and location of a neutron?", "No charge (neutral), located in the atomic nucleus.");
  add("What is the charge and location of an electron?", "Negative charge, in orbitals surrounding the nucleus.");
  add("What defines the atomic number of an element?", "The number of protons in its nucleus.");
  add("What is an isotope?", "Atoms of the same element that differ in neutron number.");
  add("What is a covalent bond?", "A chemical bond formed when atoms share one or more pairs of electrons.");
  add("What is an ionic bond?", "An electrostatic attraction between oppositely charged ions formed after electron transfer.");
  add("What is a hydrogen bond?", "A weak interaction between a partially positive hydrogen and a partially negative atom such as oxygen or nitrogen.");
  add("Why is water considered a polar molecule?", "Because oxygen is more electronegative than hydrogen, creating partial charges and a bent shape.");
  add("What property of water allows it to stick to itself?", "Cohesion, largely due to hydrogen bonding between water molecules.");
  add("What property of water allows it to stick to other surfaces?", "Adhesion, due to interactions between water and other polar or charged surfaces.");
  add("Why does water have a high specific heat?", "Hydrogen bonds absorb heat when they break and release heat when they form, buffering temperature changes.");
  add("Why is water an excellent solvent for many biological molecules?", "Its polarity allows it to surround and stabilize ions and polar molecules.");
  add("What happens to hydrogen bonding in water as it freezes?", "Hydrogen bonds become more ordered, holding molecules farther apart and making ice less dense than liquid water.");
  add("What is pH a measure of?", "The concentration of hydrogen ions (H+) in a solution.");
  add("What pH range is typical of most human body fluids?", "Slightly above or below neutral, roughly pH 7.2–7.4 depending on the fluid.");
  add("What is a buffer in biological systems?", "A substance or mixture that minimizes changes in pH by accepting or donating H+ ions.");

  // 21–40: Carbon and macromolecules overview
  add("Why is carbon the backbone of biological macromolecules?", "It can form four covalent bonds, allowing complex chains, branches, and rings.");
  add("What is an organic molecule in biology?", "A carbon-based molecule that usually contains C–H bonds and may include O, N, P, S, and others.");
  add("What is a functional group?", "A specific group of atoms within a molecule that confers characteristic chemical properties.");
  add("Name the four major classes of biological macromolecules.", "Carbohydrates, lipids, proteins, and nucleic acids.");
  add("What is a monomer?", "A small unit that can join with others to form a polymer.");
  add("What is a polymer?", "A long molecule made of many repeating monomer units covalently bonded together.");
  add("What reaction links monomers to form polymers?", "Dehydration (condensation) reactions that remove water.");
  add("What reaction breaks polymers into monomers?", "Hydrolysis reactions that add water to break covalent bonds.");
  add("What is the general empirical formula of many simple carbohydrates?", "Approximately (CH2O)n.");
  add("What is a disaccharide?", "A carbohydrate composed of two monosaccharide units linked by a glycosidic bond.");
  add("What is a polysaccharide?", "A carbohydrate polymer made of many monosaccharide units.");
  add("What type of macromolecule are triglycerides?", "Lipids made of glycerol and three fatty acids.");
  add("What is a phospholipid?", "A lipid with two fatty acid tails and a phosphate-containing head group attached to glycerol.");
  add("What does amphipathic mean for a molecule like a phospholipid?", "It has both hydrophobic (nonpolar) and hydrophilic (polar) regions.");
  add("What are the monomers of proteins?", "Amino acids.");
  add("Approximately how many different amino acids are encoded in the standard genetic code?", "Twenty.");
  add("What are the two main types of nucleic acids?", "DNA (deoxyribonucleic acid) and RNA (ribonucleic acid).");
  add("What are the three components of a nucleotide?", "A nitrogenous base, a five-carbon sugar, and one or more phosphate groups.");
  add("What is a genome?", "The complete set of DNA (genetic material) in an organism or cell.");
  add("What is a gene?", "A sequence of DNA that encodes a functional product, usually a protein or functional RNA.");

  // 41–70: Carbohydrates and lipids
  add("What is glucose?", "A six-carbon monosaccharide that is a major cellular fuel.");
  add("What is fructose?", "A six-carbon monosaccharide, an isomer of glucose, commonly found in fruit.");
  add("What is sucrose composed of?", "Glucose and fructose linked together.");
  add("What is lactose composed of?", "Glucose and galactose linked together.");
  add("What is starch?", "A plant storage polysaccharide composed mainly of glucose units.");
  add("Where is glycogen primarily stored in humans?", "In liver and skeletal muscle cells.");
  add("What is cellulose?", "A structural polysaccharide of plant cell walls made of beta-glucose units.");
  add("Why can humans not digest cellulose efficiently?", "Humans lack the enzymes that break beta-1,4-glycosidic bonds between the glucose units in cellulose.");
  add("What is chitin?", "A structural polysaccharide found in fungal cell walls and arthropod exoskeletons.");
  add("What is a fatty acid?", "A hydrocarbon chain with a terminal carboxyl group.");
  add("What is a saturated fatty acid?", "A fatty acid with no double bonds between carbon atoms in the hydrocarbon chain.");
  add("What is an unsaturated fatty acid?", "A fatty acid with one or more C=C double bonds in the hydrocarbon chain.");
  add("How do double bonds affect the shape of unsaturated fatty acids?", "They introduce bends or kinks, preventing tight packing.");
  add("Why are many plant oils liquid at room temperature?", "They contain a higher proportion of unsaturated fatty acids, which reduce packing and lower melting point.");
  add("What is a trans fat?", "A fat with at least one trans double bond, often produced by partial hydrogenation of oils.");
  add("Why are trans fats considered health risks?", "They are associated with increased LDL cholesterol and cardiovascular disease risk.");
  add("What is the main structural lipid of biological membranes?", "Phospholipids organized in a bilayer.");
  add("What is cholesterol?", "A sterol lipid that modulates membrane fluidity and is a precursor of steroid hormones.");
  add("How does cholesterol affect membrane fluidity at moderate temperatures?", "It tends to reduce fluidity by restraining phospholipid movement.");
  add("How does cholesterol affect membranes at low temperatures?", "It helps prevent tight packing of phospholipids, thus maintaining fluidity.");
  add("Why are lipids a dense form of energy storage?", "They have many C–H bonds that release energy when oxidized, and they are hydrophobic so can be stored without water.");
  add("In what form do animals store most long-term energy in adipose tissue?", "As triacylglycerols (triglycerides).");
  add("What is the primary role of brown adipose tissue?", "Non-shivering thermogenesis through uncoupled mitochondrial respiration.");

  // 71–110: Proteins and enzymes
  add("What are the four general levels of protein structure?", "Primary, secondary, tertiary, and quaternary structure.");
  add("What is primary structure of a protein?", "The linear sequence of amino acids in a polypeptide.");
  add("What largely determines a protein's three-dimensional structure?", "Its amino acid sequence (primary structure) and the chemical properties of the side chains.");
  add("What is an alpha helix?", "A common protein secondary structure where the polypeptide backbone coils with hydrogen bonds every fourth amino acid.");
  add("What is a beta sheet?", "A protein secondary structure in which strands lie side by side, linked by hydrogen bonds between backbone segments.");
  add("What bonds stabilize tertiary protein structure?", "Hydrogen bonds, ionic bonds, hydrophobic interactions, van der Waals forces, and disulfide bridges.");
  add("What is quaternary structure of a protein?", "The association of two or more polypeptide subunits into a functional complex.");
  add("What is protein denaturation?", "Loss of a protein's native structure due to heat, pH changes, or chemicals, often leading to loss of function.");
  add("What is an enzyme?", "A biological catalyst, usually a protein, that speeds up chemical reactions without being consumed.");
  add("What is an enzyme's active site?", "The region of the enzyme where substrate molecules bind and undergo a chemical reaction.");
  add("What is activation energy?", "The energy barrier that must be overcome for a chemical reaction to proceed.");
  add("How do enzymes affect activation energy?", "They lower activation energy, increasing the reaction rate.");
  add("What is substrate specificity?", "The tendency of an enzyme to bind only particular substrates that fit its active site.");
  add("What is the induced fit model of enzyme action?", "The concept that an enzyme slightly changes shape when the substrate binds, improving complementarity.");
  add("What is a cofactor?", "A non-protein helper, such as a metal ion or coenzyme, required for some enzymes to function.");
  add("What is a coenzyme?", "An organic cofactor, often derived from vitamins, that assists enzyme activity.");
  add("What is competitive inhibition of an enzyme?", "Inhibition where a molecule competes with substrate for binding at the active site.");
  add("What is noncompetitive inhibition of an enzyme?", "Inhibition where a molecule binds to a site other than the active site, altering enzyme activity.");
  add("How does temperature generally affect enzyme activity?", "Reaction rate increases with temperature up to an optimum, then falls as the enzyme denatures.");
  add("How does pH affect enzyme activity?", "Each enzyme has an optimal pH; deviations can disrupt ionic and hydrogen bonds and reduce activity.");
  add("What is allosteric regulation?", "Regulation of an enzyme by binding of a molecule at a site other than the active site, influencing activity.");
  add("What is feedback inhibition?", "A metabolic control where the end product of a pathway inhibits an enzyme earlier in the pathway.");
  add("Why are enzymes important in cell metabolism?", "They allow metabolic reactions to proceed rapidly and under mild physiological conditions.");
  add("What is a metabolic pathway?", "A series of enzyme-catalyzed reactions leading to a specific end product or set of products.");

  // 111–150: Cell structure and membranes
  add("What are the two major cell types in biology?", "Prokaryotic cells and eukaryotic cells.");
  add("What domains contain prokaryotes?", "Bacteria and Archaea.");
  add("What key feature distinguishes eukaryotic cells from prokaryotic cells?", "Eukaryotic cells have membrane-bound organelles, including a nucleus; prokaryotic cells do not.");
  add("What is the plasma membrane?", "A phospholipid bilayer with embedded proteins that surrounds the cell and controls movement of substances in and out.");
  add("What is the cytoplasm?", "The region of the cell between the plasma membrane and the nucleus, containing cytosol and organelles.");
  add("What is the nucleus?", "A membrane-bound organelle that houses the cell's DNA in eukaryotes.");
  add("What is the nucleolus?", "A dense region in the nucleus where ribosomal RNA is synthesized and ribosomal subunits are assembled.");
  add("What is the endoplasmic reticulum (ER)?", "A membranous network involved in protein and lipid synthesis; it includes rough ER and smooth ER.");
  add("What distinguishes rough ER from smooth ER?", "Rough ER is studded with ribosomes and specializes in protein synthesis; smooth ER lacks ribosomes and is involved in lipid synthesis and detoxification.");
  add("What is the Golgi apparatus?", "A stack of membrane-bound sacs that modifies, sorts, and packages proteins and lipids for secretion or use in the cell.");
  add("What are lysosomes?", "Membrane-bound organelles containing hydrolytic enzymes that digest macromolecules and damaged organelles.");
  add("What are peroxisomes?", "Organelles that carry out oxidation reactions, including breakdown of fatty acids and detoxification, producing and degrading hydrogen peroxide.");
  add("What are mitochondria?", "Organelles that carry out aerobic respiration and ATP production in eukaryotic cells.");
  add("What is the main function of chloroplasts?", "Photosynthesis in plant and algal cells, converting light energy into chemical energy stored in carbohydrates.");
  add("What is the cytoskeleton?", "A network of protein fibers (microfilaments, intermediate filaments, microtubules) that provides structure, movement, and intracellular transport.");
  add("What is a microtubule?", "A hollow tube made of tubulin dimers that helps maintain cell shape, form cilia and flagella, and guide chromosome movement.");
  add("What structures form the spindle apparatus during mitosis?", "Microtubules organized by centrosomes or spindle pole bodies.");
  add("What is the extracellular matrix (ECM)?", "A complex network of proteins and carbohydrates outside animal cells that provides structural and biochemical support.");
  add("What is the fluid mosaic model of membranes?", "The concept that membranes consist of a fluid phospholipid bilayer with proteins and other components that can move laterally.");
  add("What type of molecules can diffuse directly through the phospholipid bilayer?", "Small nonpolar molecules such as oxygen and carbon dioxide.");
  add("What is facilitated diffusion?", "Passive transport of molecules across membranes through specific channels or carriers, down their concentration gradient.");
  add("What is active transport?", "Transport of substances across a membrane against their concentration gradient using energy, often from ATP.");
  add("What is the sodium-potassium pump?", "A membrane transport protein that uses ATP to move Na+ out of cells and K+ into cells.");
  add("What is endocytosis?", "A process where the cell takes in material by forming vesicles from the plasma membrane.");
  add("What is exocytosis?", "A process where vesicles fuse with the plasma membrane to release their contents outside the cell.");
  add("What are gap junctions?", "Specialized intercellular connections in animal cells that allow direct communication via small molecules and ions.");
  add("What are plasmodesmata?", "Channels through plant cell walls that connect cytoplasm of adjacent cells for communication and transport.");

  // 151–200: DNA, genomes, and cell cycle
  add("What is the primary function of DNA?", "To store and transmit genetic information used in development, functioning, and reproduction.");
  add("What is the sugar in DNA?", "Deoxyribose.");
  add("What is the sugar in RNA?", "Ribose.");
  add("What are the four nitrogenous bases in DNA?", "Adenine, thymine, cytosine, and guanine.");
  add("What are the four standard bases in RNA?", "Adenine, uracil, cytosine, and guanine.");
  add("Which bases pair together in DNA?", "Adenine with thymine, and cytosine with guanine.");
  add("What type of bonding holds the two strands of DNA together?", "Hydrogen bonds between complementary bases.");
  add("What is meant by antiparallel strands in DNA?", "The two strands run in opposite 5' to 3' directions.");
  add("What enzyme synthesizes new DNA strands during replication?", "DNA polymerase.");
  add("In what direction does DNA polymerase add nucleotides?", "In the 5' to 3' direction on the growing strand.");
  add("What is the origin of replication?", "A specific DNA sequence at which DNA replication begins.");
  add("What is the leading strand in DNA replication?", "The strand synthesized continuously in the same direction as the replication fork movement.");
  add("What is the lagging strand in DNA replication?", "The strand synthesized discontinuously as short Okazaki fragments opposite fork movement.");
  add("What is helicase?", "An enzyme that unwinds and separates the DNA strands at the replication fork.");
  add("What is primase?", "An enzyme that synthesizes short RNA primers for DNA polymerase to extend.");
  add("What is ligase in DNA replication?", "An enzyme that joins Okazaki fragments by sealing nicks in the sugar-phosphate backbone.");
  add("What is transcription?", "The synthesis of an RNA strand using DNA as a template.");
  add("What is translation in molecular biology?", "The process of synthesizing a polypeptide using mRNA as a template and ribosomes and tRNAs.");
  add("What is a codon?", "A three-nucleotide sequence in mRNA that specifies an amino acid or stop signal.");
  add("What is the start codon in most organisms?", "AUG, which codes for methionine and signals translation initiation.");
  add("What is a mutation?", "A heritable change in the DNA sequence.");
  add("What is a point mutation?", "A mutation affecting a single nucleotide pair in DNA.");
  add("What is a silent mutation?", "A nucleotide change that does not alter the encoded amino acid.");
  add("What is a missense mutation?", "A nucleotide change that results in a different amino acid in the protein.");
  add("What is a nonsense mutation?", "A mutation that converts a codon into a stop codon, truncating the protein.");
  add("What is a frameshift mutation?", "An insertion or deletion not in multiples of three that shifts the reading frame of the codons.");
  add("What is chromatin?", "DNA associated with histone and other proteins, forming the material of chromosomes.");
  add("What is a chromosome?", "A single DNA molecule associated with proteins, carrying part of the cell's genetic information.");
  add("During which cell cycle phase is DNA replicated?", "The S (synthesis) phase of interphase.");
  add("What are the main phases of mitosis?", "Prophase, metaphase, anaphase, and telophase.");
  add("What is cytokinesis?", "Division of the cytoplasm to form two separate daughter cells after mitosis or meiosis.");
  add("What is the cell cycle checkpoint?", "A control point where stop or go-ahead signals regulate progression through the cell cycle.");
  add("What is apoptosis?", "Programmed cell death, a regulated process for removing damaged or unnecessary cells.");
  add("What is a tumor suppressor gene?", "A gene that encodes a protein helping prevent uncontrolled cell division; loss-of-function mutations can contribute to cancer.");
  add("What is an oncogene?", "A mutated or overexpressed version of a gene that promotes cell division and can contribute to cancer.");
  add("What is meiosis primarily used for?", "Producing haploid gametes for sexual reproduction.");
  add("How many chromosomes are in a typical human somatic cell?", "46 chromosomes (23 pairs).");
  add("How many chromosomes are in a typical human gamete?", "23 chromosomes.");
  add("What is a karyotype?", "An organized image of the chromosomes of a cell arranged by size and shape.");
  add("What is genomics?", "The field of study focused on sequencing, mapping, and analyzing entire genomes.");
  add("What is a model organism in genomics?", "A species widely studied to understand biological processes that can apply to other organisms, such as yeast, fruit flies, or mice.");
  add("How can genome information aid pre-PA students clinically?", "It helps explain genetic disease mechanisms, pharmacogenomics, and personalized medicine.");

  // Extra integrative and clinical-context cards to reach 200
  add("Why are phospholipid bilayers selectively permeable?", "Their hydrophobic core blocks most ions and polar molecules while allowing small nonpolar molecules to diffuse.");
  add("How do transport proteins contribute to membrane selectivity?", "They bind specific solutes and provide regulated pathways across the membrane.");
  add("What is osmolarity?", "The total concentration of solute particles in a solution, influencing water movement.");
  add("What happens to an animal cell placed in a hypotonic solution?", "Water enters the cell, which may swell and potentially lyse.");
  add("What happens to a cell placed in a hypertonic solution?", "Water leaves the cell, causing it to shrink or crenate.");
  add("What is isotonic solution for human red blood cells?", "A solution with similar solute concentration to plasma, so there is no net water movement.");
  add("What is signal transduction?", "The process by which a cell converts an external signal into an internal response through a signaling pathway.");
  add("What is a receptor protein?", "A protein that specifically binds a signaling molecule (ligand) and initiates a cellular response.");
  add("Why is DNA repair important for genome stability?", "It corrects damage and replication errors that could otherwise lead to mutations and disease.");
  add("What is mismatch repair?", "A DNA repair pathway that recognizes and fixes base-pairing errors made during replication.");
  add("What is nucleotide excision repair?", "A repair mechanism that removes bulky DNA lesions, such as thymine dimers, and fills the gap using DNA polymerase and ligase.");
  add("What role do telomeres play in chromosomes?", "They protect chromosome ends from degradation and fusion, and shorten with repeated cell divisions.");
  add("What enzyme can extend telomeres?", "Telomerase, which adds repetitive DNA sequences to chromosome ends in certain cells.");
  add("Why are rapidly dividing cells often sensitive to DNA-damaging chemotherapy?", "They replicate DNA frequently, so damage and replication stress more readily trigger cell death.");
  add("How can understanding cell cycle checkpoints help future PAs?", "It informs use of drugs that target dividing cells and helps interpret cancer therapies.");
  add("Why are germline mutations clinically important?", "They are inherited and can predispose individuals to genetic diseases.");
  add("Why are somatic mutations clinically important?", "They are acquired in body cells and can lead to cancers or mosaic disorders.");
  add("How does knowledge of membrane transport help interpret IV fluid therapy?", "It explains how different fluid types affect cell volume and tissue hydration.");
  add("Why is ATP described as the cell's energy currency?", "Its high-energy phosphate bonds can be hydrolyzed to drive many energy-requiring processes.");
  add("How is the central dogma (DNA → RNA → protein) clinically relevant?", "It underlies genetic testing, interpretation of variants, and understanding mechanisms of many diseases.");

  if (cards.length > 300) {
    throw new Error(`Topic exceeds 300 cards; got ${cards.length}.`);
  }
  return cards;
}

async function main() {
  const cards = buildBiomoleculesCellsGenomesCards();

  const subjectSlug = "pre-pa-track";
  const topicSlug = "introduction-to-biomolecules-cells-genomes";
  const topicName = "Introduction to biomolecules, cells, and genomes";

  const subject = await prisma.subject.upsert({
    where: { slug: subjectSlug },
    update: { name: "Pre-PA Track" },
    create: {
      slug: subjectSlug,
      name: "Pre-PA Track",
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
        order: 100,
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

