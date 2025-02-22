import { useState } from 'react';

import { ShortNumberInput } from '@/components/short-number-input';

type TalentProps = { name: string; level: number; min: number; max: number };
function Talent(props: TalentProps) {
  const [value, setValue] = useState(() => props.level);

  return (
    <div className="flex gap-2 items-center">
      <span className="text-lg font-medium">{props.name}</span>
      <ShortNumberInput
        value={value}
        onChange={setValue}
        min={props.min}
        max={props.max}
      />
    </div>
  );
}

export function TalentsInfo() {
  return (
    <div>
      <span className="text-2xl font-semibold">Talents</span>
      <div className="flex gap-4 justify-between w-full">
        <Talent name="Attack" level={9} min={0} max={10} />
        <Talent name="Skill" level={13} min={0} max={13} />
        <Talent name="Burst" level={13} min={0} max={13} />
      </div>
    </div>
  );
}
