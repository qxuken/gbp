import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";

export function CharacterInfo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon"><Icons.info /></Button>
      </PopoverTrigger>
      <PopoverContent side="right">
        <div className='grid grid-cols-2 gap-1'>
          <span>Rarity</span><Badge className='bg-amber-300'>5</Badge>
          <span>Element</span><Badge className='bg-red-700 text-white hover:text-black'>Pyro</Badge>
          <span>Weapon</span><Badge variant="secondary">Sword</Badge>
        </div>
      </PopoverContent>
    </Popover>
  )
}
