'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../shadcn/Popover';
import { Button } from '../shadcn/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../shadcn/Command';
import { cn } from '@/utils/Types';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const aclFilter = [
  {
    value: 'all-policies',
    label: 'All Policies',
  },
  {
    value: 'active-policies',
    label: 'Active Policies',
  },
  {
    value: 'inactive-policies',
    label: 'Inactive Policies',
  },
];

export function ACLFiltersCombobox({ onChange }: { onChange: (value: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('all-policies');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="default" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
          {aclFilter.find((filter) => filter.value === value)?.label}
          <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] bg-bg-contrastDefault text-text-primary p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {aclFilter.map((gatewayFilter) => (
                <CommandItem
                  key={gatewayFilter.value}
                  value={gatewayFilter.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue);
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <CheckCircleIcon
                    className={cn('mr-2 h-4 w-4', value === gatewayFilter.value ? 'opacity-100' : 'opacity-0')}
                  />
                  {gatewayFilter.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}