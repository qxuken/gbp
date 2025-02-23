import { useState } from 'react';

import { CharacterPlans } from '@/api/types';
import { Icons } from '@/components/icons';
import { ShortNumberInput } from '@/components/short-number-input';

type TalentProps = {
  name: string;
  current: number;
  target: number;
  min: number;
  max: number;
};
function Talent(props: TalentProps) {
  const [current, setCurrent] = useState(() => props.current);
  const [target, setTarget] = useState(() => props.target);

  return (
    <div className="flex gap-2 items-center">
      <span className="text-lg font-medium">{props.name}</span>
      <div className="flex gap-1 items-center">
        <ShortNumberInput
          value={current}
          onChange={setCurrent}
          min={props.min}
          max={props.max}
        />
        <Icons.right className="size-4" />
        <ShortNumberInput
          value={target}
          onChange={setTarget}
          min={props.min}
          max={props.max}
        />
      </div>
    </div>
  );
}

type Props = { build: CharacterPlans };
export function TalentsInfo({ build }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-2xl font-semibold">Talents</span>
      <div className="flex gap-4 justify-between w-full">
        <Talent
          name="Attack"
          current={build.talent_atk_current ?? 0}
          target={build.talent_atk_target ?? 0}
          min={0}
          max={10}
        />
        <Talent
          name="Skill"
          current={build.talent_skill_current ?? 0}
          target={build.talent_skill_target ?? 0}
          min={0}
          max={13}
        />
        <Talent
          name="Burst"
          current={build.talent_burst_current ?? 0}
          target={build.talent_burst_target ?? 0}
          min={0}
          max={13}
        />
      </div>
    </div>
  );
}
