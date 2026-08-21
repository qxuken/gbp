import { createFileRoute, Link } from '@tanstack/react-router';
import { motion, useReducedMotion } from 'motion/react';
import {
  CSSProperties,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useElementsMap,
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
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { useElementScope } from '@/hooks/use-element-scope';
import { cn } from '@/lib/utils';
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

function useMockData(seed: number, pinned?: Characters): MockData | null {
  const characters = useCharacters();
  const weapons = useWeapons();
  const specials = useSpecials();
  const artifactSets = useArtifactSets();
  const artifactTypes = useArtifactTypes();

  return useMemo(() => {
    if (
      !characters.length ||
      !weapons.length ||
      !artifactSets.length ||
      !artifactTypes.length ||
      !specials.length
    ) {
      return null;
    }

    const random = createRandom(seed);
    const pool = pinned
      ? characters.filter((c) => c.id !== pinned.id)
      : characters;

    const [
      drawnCharacter,
      character2,
      character3,
      character4,
      character5,
      character6,
      character7,
    ] = getRandomItems(pool, 7, random);
    const character1 = pinned ?? drawnCharacter;
    if (!character1) {
      return null;
    }
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
    /* A draw can come up short when the pool is small or fully filtered out,
       so the card is built from whatever was actually drawn. */
    if (!weapon1 || !artifactSet1 || !artifactType1) {
      return null;
    }
    const [special1] = getRandomItems(artifactType1.specials, 1, random);
    const [special2] = artifactType2
      ? getRandomItems(artifactType2.specials, 1, random)
      : [];
    const substats = getRandomItems(
      specials,
      2,
      random,
      (s) => s.substat == 1,
    ).map((s) => s.id);

    const teamMembers = [
      character2,
      character3,
      character4,
      character5,
      character6,
      character7,
    ].filter((c) => c !== undefined);
    const teamPlans: TeamPlans[] = [];
    for (let i = 0; i < teamMembers.length; i += 3) {
      teamPlans.push({
        id: `team-${teamPlans.length + 1}`,
        characterPlan: 'plan-1',
        characters: teamMembers.slice(i, i + 3).map((c) => c.id),
        created: new Date(),
        updated: new Date(),
      });
    }

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
    ];
    if (weapon2) {
      weaponPlans.push({
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
      });
    }

    // Either a single 4-piece set or a 2+2 split, so both shapes get shown.
    const fourPieceSet = random() < 0.5;
    const artifactSetsPlans: ArtifactSetsPlans[] = [
      {
        id: 'artifact-set-plan-1',
        characterPlan: 'plan-1',
        artifactSets:
          fourPieceSet || !artifactSet2
            ? [artifactSet1.id]
            : [artifactSet1.id, artifactSet2.id],
        order: 0,
        created: new Date(),
        updated: new Date(),
      },
    ];

    const artifactTypePlans: ArtifactTypePlans[] = [];
    if (special1) {
      artifactTypePlans.push({
        id: 'artifact-type-plan-1',
        characterPlan: 'plan-1',
        artifactType: artifactType1.id,
        special: special1,
        created: new Date(),
        updated: new Date(),
      });
    }
    if (artifactType2 && special2) {
      artifactTypePlans.push({
        id: 'artifact-type-plan-2',
        characterPlan: 'plan-1',
        artifactType: artifactType2.id,
        special: special2,
        created: new Date(),
        updated: new Date(),
      });
    }

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
        substats,
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
  }, [
    seed,
    pinned,
    characters,
    weapons,
    specials,
    artifactSets,
    artifactTypes,
  ]);
}

export const Route = createFileRoute('/_auth/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [seed, setSeed] = useState(() => (Math.random() * 2 ** 32) >>> 0);
  const [pinned, setPinned] = useState<Characters | undefined>(undefined);
  const mockData = useMockData(seed, pinned);
  const character = mockData?.character1;
  const { style: elementStyle } = useElementScope(character?.element);

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
      {/* The page wears the element of whoever is on the card right now. */}
      <div
        className="element-scope mx-auto w-full max-w-6xl"
        style={elementStyle}
      >
        <section className="relative grid gap-4 py-10 pl-5 sm:pl-7">
          <span
            aria-hidden
            className="absolute inset-y-4 left-0 w-[3px] rounded-full bg-gradient-to-b from-element via-element/70 to-transparent"
          />
          <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(105deg, var(--element), color-mix(in oklab, var(--element) 20%, var(--foreground)) 70%)',
              }}
            >
              Genshin Build Planner
            </span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            One card per character: level, constellation and talent targets, the
            weapons and artifact sets you want, the teams you run them in, and
            what is still left to farm.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button asChild size="lg">
              <Link to="/signup">Sign up</Link>
            </Button>
            <span className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
              >
                Log in
              </Link>
            </span>
          </div>
        </section>

        <Roster selected={character} onSelect={setPinned} />

        <section className="grid items-start gap-8 py-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {character ? `${character.name}'s card` : 'Example card'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
                onClick={() => setSeed((v) => (v + 0x9e3779b9) >>> 0)}
              >
                <Icons.Retry className="size-3.5" />
                Reroll gear
              </Button>
            </div>
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

          <div className="grid gap-5">
            <dl className="grid gap-x-4 gap-y-2 rounded-xl border border-border bg-card/70 p-4 text-sm shadow-sm sm:grid-cols-[auto_minmax(0,1fr)]">
              <dt className="text-muted-foreground">Source</dt>
              <dd className="mb-1.5 sm:mb-0">
                <a
                  className="underline underline-offset-4 hover:text-muted-foreground"
                  href="https://github.com/qxuken/gbp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/qxuken/gbp
                </a>
                <span className="text-muted-foreground"> - MIT</span>
              </dd>

              <dt className="text-muted-foreground">Self-host</dt>
              <dd className="flex flex-wrap gap-1.5">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  docker pull qxuken/gbp
                </code>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  nu build.nu
                </code>
              </dd>
            </dl>

            <div className="grid gap-2 rounded-xl border border-border bg-card/70 p-4 shadow-sm">
              <h2 className="font-display text-sm font-bold tracking-tight">
                Game data as SQLite
              </h2>
              <p className="text-sm text-muted-foreground">
                Everything the planner knows about the game - characters,
                weapons, artifact sets, main and sub stats, domains and patches
                - ships as one SQLite file. Take it and build your own thing on
                top of it.
              </p>
              <a
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                href="/api/dump/latest_seed.db"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icons.Download className="size-3.5" />
                Download seed.db
              </a>
              <p className="text-xs leading-relaxed text-muted-foreground/80">
                Offered as-is, with no warranty. Genshin Impact names, artwork
                and stats belong to HoYoverse; GBP is a fan tool, not affiliated
                with or endorsed by them, and whatever you build with the file
                stays your responsibility.
              </p>
            </div>
          </div>
        </section>
      </div>
    </FiltersProvider>
  );
}

type RosterProps = {
  selected?: Characters;
  onSelect(character: Characters): void;
};

/**
 * The roster is the page's argument: every character in the game is a card
 * waiting to be filled in. Picking one rebuilds the card below and re-tints
 * the page, which is exactly what the app does once you are inside it.
 */
function Roster({ selected, onSelect }: RosterProps) {
  const characters = useCharacters();
  const elementsMap = useElementsMap();
  const reducedMotion = useReducedMotion();
  const stripRef = useRef<HTMLDivElement | null>(null);
  /* Set when the keyboard moved the selection, so focus follows it there. */
  const focusOnSelectRef = useRef(false);

  /* Arrow keys walk the roster; only the current entry is a tab stop. */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const current = characters.findIndex((c) => c.id === selected?.id);
    /* Nothing picked yet: step onto the end the key points at, instead of
       walking from an index that isn't there and skipping a character. */
    const next =
      current < 0
        ? characters[step > 0 ? 0 : characters.length - 1]
        : characters[(current + step + characters.length) % characters.length];
    if (next) {
      focusOnSelectRef.current = true;
      onSelect(next);
    }
  };

  /* Centre the current character without dragging the page along with it. */
  useEffect(() => {
    const strip = stripRef.current;
    const item = strip?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!strip || !item) return;
    strip.scrollTo({
      left: item.offsetLeft - strip.clientWidth / 2 + item.clientWidth / 2,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
    if (focusOnSelectRef.current) {
      focusOnSelectRef.current = false;
      item.focus({ preventScroll: true });
    }
  }, [selected?.id, reducedMotion]);

  return (
    <section className="grid min-w-0 gap-2.5">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Pick anyone
        </span>
        <span className="font-mono text-[11px] text-muted-foreground/70">
          {characters.length || '...'} characters
        </span>
      </div>
      <div
        ref={stripRef}
        role="listbox"
        aria-label="Characters"
        onKeyDown={onKeyDown}
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1 [mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {characters.map((character, i) => {
          const isSelected = selected?.id === character.id;
          return (
            <motion.button
              key={character.id}
              type="button"
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: reducedMotion ? 0 : Math.min(i, 24) * 0.012,
              }}
              style={
                {
                  '--element': elementsMap.get(character.element ?? '')?.color,
                } as CSSProperties
              }
              className={cn(
                'element-scope shrink-0 rounded-lg p-0.5 ring-1 transition-colors',
                isSelected
                  ? 'bg-element/20 ring-element/60'
                  : 'ring-transparent hover:bg-element/10 hover:ring-element/40 focus-visible:ring-element/60 focus-visible:outline-none',
              )}
              onClick={() => onSelect(character)}
              role="option"
              aria-selected={isSelected}
              aria-label={character.name}
              tabIndex={isSelected ? 0 : -1}
              title={character.name}
            >
              <CollectionAvatar
                record={character}
                fileName={character.icon}
                name={character.name}
                className="size-11 rounded-md"
              />
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
