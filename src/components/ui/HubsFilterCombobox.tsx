'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../shadcn/Popover';
import { Button } from '../shadcn/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../shadcn/Command';
import { cn } from '@/utils/Types';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const hubsFilter = [
  {
    value: 'all-nodes',
    label: 'All Nodes',
  },
  {
    value: 'hubs',
    label: 'Hubs',
  },
  {
    value: 'has-hub-assigned',
    label: 'Has Hub Assigned',
  },
];

export function HubsFilterCombobox({ onChange }: { onChange: (value: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('all-nodes');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="default" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
          {hubsFilter.find((framework) => framework.value === value)?.label}
          <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] bg-bg-contrastDefault text-text-primary p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {hubsFilter.map((hubFilter) => (
                <CommandItem
                  key={hubFilter.value}
                  value={hubFilter.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue);
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <CheckCircleIcon
                    className={cn('mr-2 h-4 w-4', value === hubFilter.value ? 'opacity-100' : 'opacity-0')}
                  />
                  {hubFilter.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
