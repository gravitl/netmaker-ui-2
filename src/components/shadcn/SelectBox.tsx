import { CaretSortIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import React from 'react';

import { cn } from '@/utils/Types';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/shadcn/Command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/Popover';
import { ScrollArea } from '@/components/shadcn/ScrollArea';
import { Button } from '@/components/shadcn/Button';

interface Option {
  value: string;
  label: string;
}

interface SelectBoxProps {
  options: Option[];
  value?: string[] | string;
  onChange?: (values: string[] | string) => void;
  placeholder?: string;
  inputPlaceholder?: string;
  emptyPlaceholder?: string;
  className?: string;
  multiple?: boolean;
}

const SelectBox = React.forwardRef<HTMLInputElement, SelectBoxProps>(
  ({ inputPlaceholder, emptyPlaceholder, placeholder, className, options, value, onChange, multiple }, ref) => {
    const [searchTerm, setSearchTerm] = React.useState<string>('');
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSelect = (selectedValue: string) => {
      if (multiple) {
        const newValue =
          value?.includes(selectedValue) && Array.isArray(value)
            ? value.filter((v) => v !== selectedValue)
            : [...(value ?? []), selectedValue];
        onChange?.(newValue);
      } else {
        onChange?.(selectedValue);
        setIsOpen(false);
      }
    };

    const handleClear = () => {
      onChange?.(multiple ? [] : '');
    };

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'flex min-h-[36px] cursor-pointer items-center justify-between rounded-md border px-3 py-1 data-[state=open]:border-ring w-full h-full',
              className,
            )}
          >
            <div
              className={cn(
                'items-center gap-1 overflow-hidden text-sm',
                multiple ? 'flex flex-grow flex-wrap ' : 'inline-flex whitespace-nowrap',
              )}
            >
              {value && value.length > 0 ? (
                multiple ? (
                  options
                    .filter((option) => Array.isArray(value) && value.includes(option.value))
                    ?.map((option) => (
                      <span
                        key={option.value}
                        className="inline-flex items-center gap-1 rounded-md border py-0.5 pl-2 pr-1 text-xs font-medium text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <span>{option.label}</span>
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            handleSelect(option.value);
                          }}
                          className="flex items-center rounded-sm px-[1px] text-muted-foreground/60 hover:bg-accent hover:text-muted-foreground"
                        >
                          <Cross2Icon />
                        </span>
                      </span>
                    ))
                ) : (
                  options.find((opt) => opt.value === value)?.label
                )
              ) : (
                <span className="mr-auto text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center self-stretch pl-1 text-muted-foreground/60 hover:text-foreground [&>div]:flex [&>div]:items-center [&>div]:self-stretch">
              {value && value.length > 0 ? (
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    handleClear();
                  }}
                >
                  <Cross2Icon className="size-4" />
                </div>
              ) : (
                <div>
                  <CaretSortIcon className="size-4" />
                </div>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <div className="relative">
              <CommandInput
                value={searchTerm}
                onValueChange={(e: unknown) => setSearchTerm(e as string)}
                ref={ref}
                placeholder={inputPlaceholder ?? 'Search...'}
                className="h-9"
              />
              {searchTerm && (
                <div
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm('')}
                >
                  <Cross2Icon className="size-4" />
                </div>
              )}
            </div>
            <CommandList>
              <CommandEmpty>{emptyPlaceholder ?? 'No results found.'}</CommandEmpty>
              <CommandGroup>
                <ScrollArea>
                  <div className="max-h-64">
                    {options?.map((option) => {
                      const isSelected = Array.isArray(value) && value.includes(option.value);
                      return (
                        <CommandItem
                          key={option.value}
                          // value={option.value}
                          onSelect={() => handleSelect(option.value)}
                        >
                          {multiple && (
                            <div
                              className={cn(
                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                              )}
                            >
                              <CheckIcon />
                            </div>
                          )}
                          <span>{option.label}</span>
                          {!multiple && option.value === value && (
                            <CheckIcon
                              className={cn('ml-auto', option.value === value ? 'opacity-100' : 'opacity-0')}
                            />
                          )}
                        </CommandItem>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

SelectBox.displayName = 'SelectBox';

export default SelectBox;
