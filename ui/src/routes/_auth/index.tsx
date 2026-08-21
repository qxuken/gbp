import { createFileRoute, Link } from '@tanstack/react-router';
import { Download, Package, Star } from 'lucide-react';
import { ComponentType, CSSProperties, useMemo, useState } from 'react';

import {
  useCharacters,
  useWeapons,
  useSpecials,
  useArtifactSets,
  useArtifactTypes,
} from '@/api/dictionaries/hooks';
import {
  TeamPlans,
  WeaponPlans,
  ArtifactTypePlans,
  ArtifactSetsPlans,
  Plans,
  Characters,
  Weapons,
  ArtifactSets,
} from '@/api/types';
import { Icons } from '@/components/icons';
import { PlanInfo } from '@/components/plan-card/plan-info';
import { PlanInfoSkeleton } from '@/components/plan-card/plan-info-skeleton';
import { Button } from '@/components/ui/button';
import { FiltersProvider } from '@/store/plans/filters';

interface MockData {
  teamPlans: TeamPlans[];
  weaponPlans: WeaponPlans[];
  artifactSetsPlans: ArtifactSetsPlans[];
  artifactTypePlans: ArtifactTypePlans[];
  plans: Plans[];
  character1: Characters;
  weapon1: Weapons;
  artifactSet1: ArtifactSets;
}

/**
 * Seeded PRNG (mulberry32). The seed has to genuinely feed the draw — with
 * `Math.random()` the memo has no real input and React Compiler caches the
 * sample forever, so rerolling does nothing.
 */
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getRandomItems<T>(
  array: T[],
  count: number,
  random: () => number,
  filter?: (item: T) => boolean,
): T[] {
  const result: T[] = [];
  const picked = new Set<number>();
  let guard = array.length * 20;

  while (result.length < count && picked.size < array.length && guard-- > 0) {
    const randomIndex = Math.floor(random() * array.length);
    const item = array[randomIndex];
    if (!picked.has(randomIndex) && (!filter || filter(item))) {
      picked.add(randomIndex);
      result.push(item);
    }
  }

  return result;
}

function useMockData(seed: number): MockData | null {
  const characters = useCharacters();
  const weapons = useWeapons();
  const specials = useSpecials();
  const artifactSets = useArtifactSets();
  const artifactTypes = useArtifactTypes();

  return useMemo(() => {
    if (!characters.length || !weapons.length || !artifactSets.length) {
      return null;
    }

    const random = createRandom(seed);

    const [
      character1,
      character2,
      character3,
      character4,
      character5,
      character6,
      character7,
    ] = getRandomItems(characters, 7, random);
    const [weapon1, weapon2] = getRandomItems(
      weapons,
      2,
      random,
      (w) =>
        character1.weaponType == w.weaponType &&
        (w.rarity == 5 || w.rarity == 4),
    );
    const [artifactSet1, artifactSet2] = getRandomItems(
      artifactSets,
      2,
      random,
      (as) => as.rarity == 5 || as.rarity == 4,
    );
    const [artifactType1, artifactType2] = getRandomItems(
      artifactTypes,
      2,
      random,
    );
    const [special1] = getRandomItems(artifactType1.specials, 1, random);
    const [special2] = getRandomItems(artifactType2.specials, 1, random);
    const [substat1, substat2] = getRandomItems(
      specials,
      2,
      random,
      (s) => s.substat == 1,
    );

    const teamPlans: TeamPlans[] = [
      {
        id: 'team-1',
        characterPlan: 'plan-1',
        characters: [character2.id, character3.id, character4.id],
        created: new Date(),
        updated: new Date(),
      },
      {
        id: 'team-2',
        characterPlan: 'plan-1',
        characters: [character5.id, character6.id, character7.id],
        created: new Date(),
        updated: new Date(),
      },
    ];

    const weaponPlans: WeaponPlans[] = [
      {
        id: 'weapon-1',
        characterPlan: 'plan-1',
        weapon: weapon1.id,
        levelCurrent: 70,
        levelTarget: 90,
        refinementCurrent: 1,
        refinementTarget: 5,
        tag: 'none',
        order: 1,
        created: new Date(),
        updated: new Date(),
      },
      {
        id: 'weapon-2',
        characterPlan: 'plan-1',
        weapon: weapon2.id,
        levelCurrent: 80,
        levelTarget: 90,
        refinementCurrent: 2,
        refinementTarget: 5,
        tag: 'current',
        order: 2,
        created: new Date(),
        updated: new Date(),
      },
    ];

    // Either a single 4-piece set or a 2+2 split, so both shapes get shown.
    const fourPieceSet = random() < 0.5;
    const artifactSetsPlans: ArtifactSetsPlans[] = [
      {
        id: 'artifact-set-plan-1',
        characterPlan: 'plan-1',
        artifactSets: fourPieceSet
          ? [artifactSet1.id]
          : [artifactSet1.id, artifactSet2.id],
        order: 0,
        created: new Date(),
        updated: new Date(),
      },
    ];

    const artifactTypePlans: ArtifactTypePlans[] = [
      {
        id: 'artifact-type-plan-1',
        characterPlan: 'plan-1',
        artifactType: artifactType1.id,
        special: special1,
        created: new Date(),
        updated: new Date(),
      },
      {
        id: 'artifact-type-plan-2',
        characterPlan: 'plan-1',
        artifactType: artifactType2.id,
        special: special2,
        created: new Date(),
        updated: new Date(),
      },
    ];

    const plans: Plans[] = [
      {
        id: 'plan-1',
        user: 'demo-user',
        complete: false,
        character: character1.id,
        characterRole: 'role-1',
        order: 1,
        constellationCurrent: 2,
        constellationTarget: 6,
        levelCurrent: 70,
        levelTarget: 90,
        talentAtkCurrent: 6,
        talentAtkTarget: 10,
        talentSkillCurrent: 6,
        talentSkillTarget: 10,
        talentBurstCurrent: 6,
        talentBurstTarget: 10,
        substats: [substat1.id, substat2.id],
        note: 'Demo build plan',
        created: new Date(),
        updated: new Date(),
        weaponPlans,
        artifactSetsPlans,
        artifactTypePlans,
        teamPlans,
      },
    ];

    return {
      teamPlans,
      weaponPlans,
      artifactSetsPlans,
      artifactTypePlans,
      plans,
      character1,
      weapon1,
      artifactSet1,
    };
  }, [seed, characters, weapons, specials, artifactSets, artifactTypes]);
}

export const Route = createFileRoute('/_auth/')({
  component: RouteComponent,
});

const FEATURES = [
  {
    title: 'Set the target',
    description:
      'Level, constellation and talents, plus every weapon and artifact set you would be happy to land.',
    icon: Icons.Artifact,
    element: '#2E8BC0',
  },
  {
    title: 'Know what to farm',
    description:
      'Mark a build as done, and see which domains cover the most of what is still missing.',
    icon: Icons.Complete,
    element: '#D4AF37',
  },
  {
    title: 'Plan around teams',
    description:
      'Try comps for each character and keep the reasoning in a note beside the build.',
    icon: Icons.Team,
    element: '#5F9E3D',
  },
];

function RouteComponent() {
  const [seed, setSeed] = useState(() => (Math.random() * 2 ** 32) >>> 0);
  const mockData = useMockData(seed);
  return (
    <FiltersProvider
      value={{
        name: '',
        complete: false,
        elements: new Set(),
        weaponTypes: new Set(),
        characters: new Set(),
        artifactSets: new Set(),
        specialsByArtifactTypePlans: new Map(),
      }}
      setValue={() => {}}
    >
      <div className="relative isolate -mx-4 -mt-4 px-4">
        <HeroWash />

        <div className="mx-auto w-full max-w-5xl">
          <section className="pt-16 pb-12 text-center sm:pt-24">
            <h1 className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
              Genshin Build Planner
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              Plan builds, manage teams, and track farming progress in one
              place.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/signup">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
          </section>

          <section className="grid gap-4 pb-16 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <Feature key={feature.title} {...feature} />
            ))}
          </section>

          <section className="pb-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              One card per character
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Everything for a build lives in a single card, tinted by the
              character&apos;s element so you can find it at a glance. Edit it
              in place — nothing to save, nothing to open.
            </p>
            <div className="mx-auto mt-8 w-full max-w-2xl text-left">
              {mockData ? (
                <PlanInfo
                  plan={mockData.plans[0]}
                  character={mockData.character1}
                  disabled={true}
                  isLoading={false}
                  isError={false}
                  update={() => {}}
                  retry={() => {}}
                  delete={() => {}}
                />
              ) : (
                <PlanInfoSkeleton />
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground/80">
              <span>A real card, built from a random character.</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs"
                onClick={() => setSeed((v) => (v + 0x9e3779b9) >>> 0)}
              >
                <Icons.Retry className="size-3.5" />
                Reroll
              </Button>
            </div>
          </section>

          <section className="mb-20 grid gap-5 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-3">
            <div className="grid gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Icons.Github className="size-4 text-muted-foreground" />
                Open source
              </h3>
              <p className="text-sm text-muted-foreground">
                MIT licensed — use it, fork it, change it.
              </p>
              <a
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                href="https://github.com/qxuken/gbp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Star className="size-3.5" />
                Star on GitHub
              </a>
            </div>

            <div className="grid gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Package className="size-4 text-muted-foreground" />
                Self-host
              </h3>
              <p className="text-sm text-muted-foreground">
                One binary, or pull the image.
              </p>
              <code className="w-fit rounded bg-muted px-2 py-1 text-xs">
                docker pull qxuken/gbp
              </code>
              <code className="w-fit rounded bg-muted px-2 py-1 text-xs">
                nu build.nu
              </code>
            </div>

            <div className="grid gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Download className="size-4 text-muted-foreground" />
                Game data
              </h3>
              <p className="text-sm text-muted-foreground">
                The dictionary ships as a SQLite file — build your own thing
                with it.
              </p>
              <a
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                href="/api/dump/latest_seed.db"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="size-3.5" />
                Download SQLite seed
              </a>
            </div>
          </section>
        </div>
      </div>
    </FiltersProvider>
  );
}

type FeatureProps = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  element: string;
};
function Feature({ title, description, icon: Icon, element }: FeatureProps) {
  return (
    <div
      className="element-scope rounded-xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-sm"
      style={{ '--element': element } as CSSProperties}
    >
      <span className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-element/35 to-element/8 text-element-fg">
        <Icon className="size-4.5" />
      </span>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

/**
 * Element-coloured wash that starts flush against the header and fades out,
 * echoing the band on a build card.
 */
const MASK = [
  'linear-gradient(to bottom, transparent 0%, black 22%, black 55%, transparent 95%)',
  'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
].join(',');

function HeroWash() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] opacity-25 dark:opacity-40"
      style={{
        background: [
          'radial-gradient(65% 55% at 24% 8%, #D4AF37, transparent 70%)',
          'radial-gradient(60% 50% at 70% 6%, #8C44FF, transparent 70%)',
          'radial-gradient(55% 45% at 48% 14%, #2E8BC0, transparent 70%)',
        ].join(','),
        maskImage: MASK,
        WebkitMaskImage: MASK,
        maskComposite: 'intersect',
        WebkitMaskComposite: 'source-in',
      }}
    />
  );
}
