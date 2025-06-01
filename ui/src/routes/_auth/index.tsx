import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Package, Download, Star } from 'lucide-react';
import { useMemo } from 'react';

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

function getRandomItems<T>(
  array: T[],
  count: number,
  filter?: (item: T) => void,
): T[] {
  const result: T[] = [];
  const picked = new Set<number>();

  while (result.length < count && picked.size < array.length) {
    const randomIndex = Math.floor(Math.random() * array.length);
    const item = array[randomIndex];
    if (!picked.has(randomIndex) && (!filter || filter(item))) {
      picked.add(randomIndex);
      result.push(item);
    }
  }

  return result;
}

function useMockData(): MockData | null {
  const characters = useCharacters();
  const weapons = useWeapons();
  const specials = useSpecials();
  const artifactSets = useArtifactSets();
  const artifactTypes = useArtifactTypes();

  return useMemo(() => {
    if (!characters.length || !weapons.length || !artifactSets.length) {
      return null;
    }

    const [character1, character2, character3, character4] = getRandomItems(
      characters,
      4,
    );
    const [weapon1, weapon2] = getRandomItems(
      weapons,
      2,
      (w) =>
        character1.weaponType == w.weaponType &&
        (w.rarity == 5 || w.rarity == 4),
    );
    const [artifactSet1, artifactSet2] = getRandomItems(
      artifactSets,
      2,
      (as) => as.rarity == 5 || as.rarity == 4,
    );
    const [artifactType1] = getRandomItems(artifactTypes, 1);
    const [special1] = getRandomItems(artifactType1.specials, 1);
    const [substat1, substat2] = getRandomItems(
      specials,
      2,
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

    const artifactSetsPlans: ArtifactSetsPlans[] = [
      {
        id: 'artifact-set-plan-1',
        characterPlan: 'plan-1',
        artifactSets: [artifactSet1.id, artifactSet2.id],
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
    ];

    const plans: Plans[] = [
      {
        id: 'plan-1',
        user: 'demo-user',
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
  }, [characters, weapons, specials, artifactSets, artifactTypes]);
}

export const Route = createFileRoute('/_auth/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const mockData = useMockData();
  return (
    <FiltersProvider
      value={{
        name: '',
        elements: new Set(),
        weaponTypes: new Set(),
        characters: new Set(),
        artifactSets: new Set(),
        specialsByArtifactTypePlans: new Map(),
      }}
      setValue={() => {}}
    >
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Genshin Build Planner
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Plan builds, manage teams, and track farming progress in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-lg transition-colors duration-200"
              to="/signup"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8 pb-16 space-y-16 flex gap-8 justify-center flex-wrap">
        <div className="pt-9 flex flex-col gap-8 items-center">
          <div className="w-full border rounded-xl p-4 text-center">
            <h3 className="text-2xl font-semibold mb-2">Character Builds</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create detailed character builds with artifacts, weapons, and
              stats.
            </p>
          </div>

          <div className="w-full flex flex-col items-center">
            <div className="w-full border rounded-xl p-4 text-center">
              <h3 className="text-2xl font-semibold mb-2">Farming Tracker</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Track farming progress and get tips for efficient resource
                planning.
              </p>
            </div>
          </div>

          <div className="w-full flex flex-col items-center">
            <div className="w-full border rounded-xl p-4 text-center">
              <h3 className="text-2xl font-semibold mb-2">Open Source</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Open source under MIT license. Feel free to use and modify.
              </p>
            </div>
          </div>

          <div className="w-full bg-card p-6 rounded-lg border">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icons.Github className="size-5" />
                  <a
                    href="https://github.com/qxuken/gbp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View on GitHub
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="size-5" />
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    docker pull qxuken/gbp
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="size-5" />
                  <span className="text-sm">
                    Build binary for your platform using
                  </span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    nu build.nu
                  </code>
                </div>
              </div>
              <a
                className="p-2 flex gap-2 justify-center items-center border rounded-lg hover:border-accent-foreground transition-colors"
                href="https://github.com/qxuken/gbp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Star className="size-4" />
                Star on GitHub
              </a>
            </div>
          </div>

          <div className="w-full flex flex-col items-center">
            <div className="w-full border rounded-xl p-4 text-center">
              <h3 className="text-2xl font-semibold mb-2">
                Latest Database Seed
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
                Use to build your own application using data
              </p>
              <a
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                href="/api/dump/latest_seed.db"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="size-4" />
                Download
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h4 className="text-xl text-muted-foreground font-semibold mb-2">
            Example build card (random)
          </h4>
          <div className="w-96">
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
        </div>
      </div>
    </FiltersProvider>
  );
}
