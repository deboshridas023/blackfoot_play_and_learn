import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import TopActions, { ExitButton } from "../components/ui/TopActions";
import { Home, History as TimelineIcon, BookOpen } from "lucide-react";

const hero = {
  eyebrow: "History & Language",
  title: "Blackfoot",
  intro: [
    "The Blackfoot people have lived across the northern plains of North America for generations, hunting bison and moving with the seasons across what is now the northern United States and southern Canada.",
    "Over time, wars, disease, government policies, and the loss of the bison brought devastating change. Yet Blackfoot communities continue to carry their history, language, and culture forward.",
    "This page gathers a brief overview of that history and an introduction to the Blackfoot language and its dialects, to give context to the stories and words you encounter in this app."
  ]
};

const sections = [
  {
    id: "history",
    title: "History of the Blackfoot People",
    body: [
      "The Blackfoot people had been one of many Native American nations that inhabited the Great Plains west of the Mississippi River. The people were bison hunters, with settlements in what is now the northern United States and southern Canada. Forced to move because of wars with neighboring tribes, the Blackfoot people settled all around the plains area, eventually concentrating in what is now Montana and Alberta.",
      "Blackfoot hunters would track and hunt game, while the remaining people would gather food and other necessities for the winter. The northern plains, where the Blackfoot settled, had harsh winters, and the flat land provided little escape from the winds. The Blackfoot Nation thrived, along with many other native groups, until the European settlers arrived in the late eighteenth century.",
      "The settlers brought with them horses and technology, but also disease and weapons. Diseases like smallpox, foreign to the natives, decimated the Blackfoot population in the mid-nineteenth century. Groups of Blackfoot people, such as Mountain Chief's tribe, rebelled against the Europeans. But in 1870, a tribe of peaceful Blackfoot were mistaken for the rebellious tribe and hundreds were slaughtered.",
      "Over the next thirty years, settlers eradicated the bison from the Great Plains. This took away the main element of the Blackfoot economy and the people's ability to be self-sustaining. With their main food source gone, the Blackfoot were forced to rely on government support."
    ]
  },
  {
    id: "residential-schools",
    title: "Residential Schools and Their Impact",
    body: [
      "In 1886, the Old Sun Residential School opened on the Siksika Reserve in Alberta. In 1908, it was described by an official survey as \"unsanitary\" and \"unsuitable in every way for such an institution\". Regardless, it remained operational until its closure in 1971.",
      "Dozens of Blackfoot children died while attending. The school was rife with physical, sexual, and psychological abuse, which left a lasting impact on the Blackfoot children who attended.",
      "The trauma endured by students, as well as the subsequent repression of their Indigenous language and culture, has been credited, in part, with the loss in the number of Blackfoot speakers."
    ]
  },
  {
    id: "language",
    title: "The Blackfoot Language (Niitsíʼpowahsin)",
    body: [
      "Blackfoot, also called Niitsíʼpowahsin (ᖹᒧᐧᑲᖷᐦᓱᐡ) or Siksiká (/ˈsɪksəkə/ SIK-sə-kə; Blackfoot: [sɪksiká], ᓱᖽᐧᖿ), is an Algonquian language spoken by the Blackfoot or Niitsitapi people, who currently live in the northwestern plains of North America.",
      "There are four dialects, three of which are spoken in Alberta, Canada, and one of which is spoken in the United States: Siksiká / ᓱᖽᐧᖿ (Blackfoot), to the southeast of Calgary, Alberta; Kainai / ᖿᐟᖻ (Blood, Many Chiefs), spoken in Alberta between Cardston and Lethbridge; Aapátohsipikani / ᖳᑫᒪᐦᓱᑯᖿᖹ (Northern Piegan), to the west of Fort MacLeod which is Brocket (Piikani); and Aamsskáápipikani / ᖳᐢᐧᖿᑯᑯᖿᖹ (Southern Piegan), in northwestern Montana.",
      "The name Blackfoot probably comes from the blackened soles of the leather shoes that the people wore.",
      "There is a distinct difference between Old Blackfoot (also called High Blackfoot), the dialect spoken by many older speakers, and New Blackfoot (also called Modern Blackfoot), the dialect spoken by younger speakers. Among the Algonquian languages, Blackfoot is relatively divergent in phonology and lexicon.",
      "The language has a fairly small phoneme inventory, consisting of 11 basic consonants and three basic vowels that have contrastive length counterparts. Blackfoot is a pitch accent language. Blackfoot language has been declining in the number of native speakers and is classified as either a threatened or endangered language, depending on the source used."
    ]
  },
  {
    id: "dialects",
    title: "Dialects and Variation",
    body: [
      "The four main Blackfoot dialects are Siksiká (ᓱᖽᐧᖿ), Káínai (ᖿᐟᖻ), Aapátohsipikani (ᖳᑫᒪᐦᓱᑯᖿᖹ), and Aamsskáápipikani (ᖳᐢᐧᖿᑯᑯᖿᖹ). Some words are different in each dialect.",
      "For example, the word for “potato” in the Kainai dialect is maatááki, but in the Piikani dialect it is paatááki. Another example is “coffee”: in Blackfoot dialects in Canada, it is niitáʼpaisiksikimi, but in the Aamsskáápipikani dialect it is áísiksikimi.",
      "These differences show how the language lives and changes across communities, even while speakers recognize each other as part of the same larger language family."
    ]
  }
];

const timeline = [
  {
    eraOrYear: "Before European contact",
    title: "Bison Hunters of the Northern Plains",
    description:
      "Blackfoot communities live as bison hunters across the Great Plains west of the Mississippi River, in what is now the northern United States and southern Canada. Seasonal movements, buffalo, and kinship shape daily life."
  },
  {
    eraOrYear: "Late 18th century",
    title: "Arrival of European Settlers",
    description:
      "European settlers arrive in increasing numbers, bringing new technologies, horses, weapons, and diseases. Relationships, trade, and conflicts begin to reshape life on the plains."
  },
  {
    eraOrYear: "Mid 19th century",
    title: "Smallpox and Population Loss",
    description:
      "Diseases like smallpox, previously unknown to the Blackfoot, spread through communities and decimate the population, contributing to major social and cultural disruption."
  },
  {
    eraOrYear: "1870",
    title: "Massacre of a Peaceful Band",
    description:
      "A tribe of peaceful Blackfoot is mistaken for a rebellious group, and hundreds are slaughtered. This tragedy becomes one of several violent turning points in Blackfoot–settler relations."
  },
  {
    eraOrYear: "Late 19th century",
    title: "Eradication of the Bison",
    description:
      "Settlers eradicate the bison from the Great Plains over the span of only a few decades. With their main food source and economic foundation destroyed, Blackfoot communities are forced to depend on government support."
  },
  {
    eraOrYear: "1886–1971",
    title: "Old Sun Residential School",
    description:
      "The Old Sun Residential School operates on the Siksika Reserve in Alberta. Children face unsanitary conditions, abuse, and forced separation from their language and culture, leaving deep intergenerational impacts."
  },
  {
    eraOrYear: "Today",
    title: "Endangered but Living Language",
    description:
      "Blackfoot (Niitsíʼpowahsin) is now classified as a threatened or endangered language. At the same time, many elders, educators, and learners are actively working to revitalize the language, document dialects, and pass it on to future generations."
  }
];

/* -------------------------------------------------------------------------- */
/*                             PRESENTATIONAL                                 */
/* -------------------------------------------------------------------------- */

function HistoryHero({ eyebrow, title, intro = [] }) {
  return (
    <Card className="p-6 sm:p-8 border border-rose-200/70">
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
        {title}
      </h1>
      <div className="mt-4 space-y-3 text-sm sm:text-base leading-relaxed text-[var(--muted)]">
        {intro.map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>
    </Card>
  );
}

function HistorySection({ id, title, body = [] }) {
  return (
    <section id={id}>
      <Card className="p-6 sm:p-8 border border-rose-200/70">
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--text)]">
          {title}
        </h2>

        <div className="mt-3 space-y-3 text-sm sm:text-base leading-relaxed text-[var(--muted)]">
          {body.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      </Card>
    </section>
  );
}

function Timeline({ items = [] }) {
  return (
    <ol className="relative border-s-2 border-rose-200/80 ms-4">
      {items.map((it, idx) => (
        <li key={idx} className="mb-8 ms-6">
          <span
            className="absolute -start-3 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-rose-300/40"
            aria-hidden="true"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
          </span>

          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            {it.eraOrYear}
          </div>
          <h3 className="mt-1 text-base sm:text-lg font-semibold text-[var(--text)]">
            {it.title}
          </h3>
          <p className="mt-2 text-sm sm:text-base text-[var(--muted)] leading-relaxed">{it.description}</p>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 MAIN PAGE                                  */
/* -------------------------------------------------------------------------- */

export default function History() {
  const navigate = useNavigate();

  return (
    <Page variant="paper">
      <Navbar />

      <div className="pt-8">
        <header>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Cultural section
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            Blackfoot history
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Background context for the language and stories in this app.
          </p>

          <TopActions right={<ExitButton onClick={() => navigate("/")} icon={Home} />} />
        </header>

        <main aria-label="Blackfoot history content" className="mt-8 pb-12">
          <div className="grid gap-6 max-w-4xl">
            <HistoryHero eyebrow={hero.eyebrow} title={hero.title} intro={hero.intro} />

            {sections.map((s) => (
              <HistorySection key={s.id} id={s.id} title={s.title} body={s.body} />
            ))}

            <Card className="p-6 sm:p-8 border border-rose-200/70">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-50 to-white ring-1 ring-amber-300/40">
                  <TimelineIcon className="h-5 w-5 text-amber-700" aria-hidden="true" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-[var(--text)]">
                  Timeline
                </h2>
              </div>
              <div className="mt-6">
                <Timeline items={timeline} />
              </div>
            </Card>

            <Card id="revitalization" className="p-6 sm:p-8 border border-rose-200/70">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-50 to-white ring-1 ring-rose-300/40">
                  <BookOpen className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-[var(--text)]">
                  Revitalization today
                </h2>
              </div>

              <p className="mt-4 text-sm sm:text-base leading-relaxed text-[var(--muted)]">
                Despite the hardships of the past, Blackfoot culture and language
                continue to endure through the dedication of elders, educators,
                and community members. Across Montana and Alberta, language
                programs, immersion schools, cultural gatherings, and digital
                learning tools are helping younger generations reconnect with
                Niitsíʼpowahsin. Many Blackfoot families are reclaiming
                traditional stories, songs, and teachings once suppressed by
                colonial policies. Today, revitalization is not only about
                preserving words—it is about restoring identity, strengthening
                community, and ensuring that Blackfoot knowledge continues to
                thrive far into the future.
              </p>
            </Card>
          </div>
        </main>
      </div>
    </Page>
  );
}
