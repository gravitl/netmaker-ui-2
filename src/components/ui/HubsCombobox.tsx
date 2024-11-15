'use client';

import { ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../shadcn/Popover';
import { Button } from '../shadcn/Button';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '../shadcn/Command';
import { cn } from '@/utils/Types';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ExtendedNode } from '@/models/Node';
import { NodesService } from '@/services/NodesService';
import { LoadingOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';

const getTextColor = (health: string) => {
  switch (health) {
    case 'connected':
      return '#07C98D';
    case 'disconnected':
      return '#E32C08';
  }
};

export function HubsCombobox({
  gateways,
  node,
  networkId,
  onUpdate,
}: {
  gateways: ExtendedNode[];
  node: ExtendedNode;
  networkId: string;
  onUpdate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<ExtendedNode | null>(null);

  // Find the current gateway if it exists
  const currentGateway = useMemo(() => {
    if (node.static_node?.ingressgatewayid) {
      return gateways.find((g) => g.id === node.static_node?.ingressgatewayid);
    }
    if (node.relayedby) {
      return gateways.find((g) => g.id === node.relayedby);
    }
    return null;
  }, [node, gateways]);

  const isGatewaySelectable = useCallback(
    (gateway: ExtendedNode): boolean => {
      if (gateway.id === node.id) return false;
      if (node.isrelay) return false;
      return true;
    },
    [node.id, currentGateway?.id],
  );

  useEffect(() => {
    setSelectedGateway(currentGateway ?? null);
  }, [currentGateway]);

  const handleUnassign = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedGateway) return;

    setIsLoading(true);
    setOpen(false);

    try {
      const relayedNodes = new Set([...(selectedGateway.relaynodes ?? [])]);
      relayedNodes.delete(node.id);

      await NodesService.updateNode(selectedGateway.id, networkId, {
        ...selectedGateway,
        relaynodes: [...relayedNodes],
      });

      setSelectedGateway(null);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to unassign hub:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (gatewayName: string) => {
    setOpen(false);

    const newGateway = gateways.find((g) => g.name === gatewayName);
    if (!newGateway || newGateway.id === selectedGateway?.id || !isGatewaySelectable(newGateway)) return;

    setIsLoading(true);
    try {
      const relayedNodes = new Set([...(newGateway.relaynodes ?? [])]);
      relayedNodes.add(node.id);

      await NodesService.updateNode(newGateway.id, networkId, {
        ...newGateway,
        relaynodes: [...relayedNodes],
      });

      setSelectedGateway(newGateway);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to update relay relationship:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayGateway = isLoading ? selectedGateway : selectedGateway || currentGateway;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={isLoading}
        >
          <div className="flex items-center justify-between flex-1 gap-2">
            <div className="flex items-center min-w-0 gap-2">
              {isLoading ? (
                <>
                  <LoadingOutlined spin />
                  <span>Updating...</span>
                </>
              ) : displayGateway ? (
                <>
                  <span
                    className="flex-shrink-0 w-2 h-2 rounded-full"
                    style={{
                      background: getTextColor(displayGateway.connected ? 'connected' : 'disconnected'),
                    }}
                  />
                  <span className="truncate">{displayGateway.name}</span>
                  <button onClick={handleUnassign} className="p-1 rounded-full hover:bg-red-100 group">
                    <XMarkIcon className="w-3 h-3 text-gray-400 group-hover:text-red-500" />
                  </button>
                </>
              ) : (
                'Assign Hub'
              )}
            </div>
            <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] bg-bg-contrastDefault text-text-primary p-0">
        <Command>
          <CommandInput placeholder="Search hubs" />
          <CommandList>
            <CommandGroup>
              {gateways.map((gateway) => {
                const isSelectable = isGatewaySelectable(gateway);
                return (
                  <CommandItem
                    key={gateway.name}
                    value={gateway.name}
                    onSelect={handleSelect}
                    className={cn('flex items-center gap-1', !isSelectable && 'opacity-50 cursor-not-allowed')}
                    disabled={!isSelectable || isLoading}
                  >
                    <CheckCircleIcon
                      className={cn('mr-2 h-4 w-4', displayGateway?.id === gateway.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <span
                      className="w-2 h-2 rounded-full text-nowrap whitespace-nowrap"
                      style={{
                        background: getTextColor(gateway.connected ? 'connected' : 'disconnected'),
                      }}
                    />
                    <span className="flex-1">{gateway.name}</span>
                    {!isSelectable && (
                      <span className="text-xs text-gray-400">
                        {gateway.id === node.id ? 'Self' : gateway.isrelay ? 'Relay' : 'In use'}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
