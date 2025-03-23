import { useEffect, useState } from 'react';
import {
  type ControllerRenderProps,
  type FieldValues,
  type Path,
} from 'react-hook-form';

import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormControl, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getShortName } from '@/lib/get-short-name';
import { cn } from '@/lib/utils';

interface AvatarInputProps<T extends FieldValues, TName extends Path<T>> {
  field: Omit<ControllerRenderProps<T, TName>, 'ref'>;
  defaultAvatarUrl?: string;
  name: string;
  className?: string;
}

export function AvatarInput<T extends FieldValues, TName extends Path<T>>({
  field: { onChange, ...field },
  defaultAvatarUrl,
  name,
  className,
}: AvatarInputProps<T, TName>) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const avatar = field.value as FileList;
    if (avatar?.[0]) {
      const url = URL.createObjectURL(avatar[0]);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [field.value]);

  const shortName = getShortName(name);
  const avatarUrl = previewUrl || defaultAvatarUrl;

  return (
    <FormItem className="flex flex-col items-center space-y-4">
      <FormLabel className="cursor-pointer">
        <div className="relative">
          <Avatar className={cn('h-20 w-20', className)}>
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{shortName}</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 rounded-full bg-primary p-1">
            <Icons.Camera className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </FormLabel>
      <FormControl>
        <Input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files?.length) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(files[0]);
              onChange(dataTransfer.files);
            }
          }}
          {...field}
          value=""
        />
      </FormControl>
    </FormItem>
  );
}
