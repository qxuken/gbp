import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"

function Talent({ name, level }: { name: string, level: number }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const open = hovered || focused;

  return (
    <div
      className='flex gap-2 items-center'
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <span className="text-lg font-medium">{name}</span>
      <Tooltip open={open}>
        <TooltipTrigger asChild><span /></TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={-5}
          className="p-0 bg-transparent text-accent-foreground">
          <Button size="icon" variant="outline" className="size-5 rounded-2xl"><Icons.minus /></Button>
        </TooltipContent>
      </Tooltip>
      <Input
        className="w-12 text-base md:text-base py-0 font-medium text-center"
        value={level}
      />
      <Tooltip open={open}>
        <TooltipTrigger asChild><span /></TooltipTrigger>
        <TooltipContent
          side="left"
          sideOffset={-5}
          className="p-0 bg-transparent text-accent-foreground">
          <Button size="icon" variant="outline" className="size-5 rounded-2xl"><Icons.plus /></Button>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export function TalentsInfo() {
  return (
    <div>
      <span className='text-2xl font-semibold'>Talents</span>
      <div className='flex gap-4 justify-between w-full'>
        <Talent name="Attack" level={9} />
        <Talent name="Skill" level={13} />
        <Talent name="Burst" level={13} />
      </div>
    </div>
  )
}
