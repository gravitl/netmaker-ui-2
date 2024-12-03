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
import { Modal, notification } from 'antd';
import { useStore } from '@/store/store';

const getTextColor = (health: string) => {
  switch (health) {
    case 'connected':
      return '#07C98D';
    case 'disconnected':
      return '#E32C08';
  }
};

export function GatewaysCombobox({
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
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<ExtendedNode | null>(null);

  const [notify, notifyCtx] = notification.useNotification();

  const currentGateway = useMemo(() => {
    if (node.static_node?.ingressgatewayid) {
      return gateways.find((gateway) => gateway.id === node.static_node?.ingressgatewayid);
    }
    if (node.relayedby) {
      return gateways.find((gateway) => gateway.id === node.relayedby);
    }
    return null;
  }, [node, gateways]);

  const isGatewaySelectable = useCallback(
    (gateway: ExtendedNode): boolean => {
      if (gateway.id === node.id) return false;
      if (node.isrelay) return false;
      return true;
    },
    [node.id, node.isrelay],
  );

  useEffect(() => {
    setSelectedGateway(currentGateway ?? null);
  }, [currentGateway]);

  const handleReassign = async (oldGateway: ExtendedNode, newGateway: ExtendedNode) => {
    setIsLoading(true);
    setOpen(false);

    try {
      const oldRelayedNodes = new Set([...(oldGateway.relaynodes ?? [])]);
      oldRelayedNodes.delete(node.id);
      await NodesService.updateNode(oldGateway.id, networkId, {
        ...oldGateway,
        relaynodes: [...oldRelayedNodes],
      });

      const newRelayedNodes = new Set([...(newGateway.relaynodes ?? [])]);
      newRelayedNodes.add(node.id);
      await NodesService.updateNode(newGateway.id, networkId, {
        ...newGateway,
        relaynodes: [...newRelayedNodes],
      });

      setSelectedGateway(newGateway);
      await store.fetchNodes();
      if (onUpdate) {
        onUpdate();
      }
      notify.success({ message: 'Gateway reassigned successfully' });
    } catch (err) {
      notify.error({ message: `Can't reassign gateway` });
      setSelectedGateway(oldGateway);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async () => {
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
      await store.fetchNodes();
      if (onUpdate) {
        onUpdate();
      }
      notify.success({ message: `Gateway unassigned successfully` });
    } catch (err) {
      notify.error({ message: `Can't unassign gateway` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: 'Confirm Unassign',
      content: 'Are you sure you want to unassign this gateway?',
      okText: 'Yes, unassign',
      cancelText: 'Cancel',
      onOk: handleUnassign,
    });
  };

  const handleSelect = async (gatewayName: string) => {
    setOpen(false);

    const newGateway = gateways.find((gateway) => gateway.name === gatewayName);
    if (!newGateway || newGateway.id === selectedGateway?.id || !isGatewaySelectable(newGateway)) return;

    if (currentGateway) {
      Modal.confirm({
        title: 'Confirm Reassign',
        content: `Are you sure you want to reassign from ${currentGateway.name} to ${newGateway.name}?`,
        okText: 'Yes, reassign',
        cancelText: 'Cancel',
        onOk: () => handleReassign(currentGateway, newGateway),
      });
      return;
    }

    setIsLoading(true);
    try {
      const relayedNodes = new Set([...(newGateway.relaynodes ?? [])]);
      relayedNodes.add(node.id);

      await NodesService.updateNode(newGateway.id, networkId, {
        ...newGateway,
        relaynodes: [...relayedNodes],
      });

      setSelectedGateway(newGateway);
      await store.fetchNodes();
      if (onUpdate) {
        onUpdate();
      }
      notify.success({ message: 'Gateway assigned successfully' });
    } catch (err) {
      notify.error({ message: `Can't assign gateway` });
    } finally {
      setIsLoading(false);
    }
  };

  const displayGateway = isLoading ? selectedGateway : selectedGateway || currentGateway;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            role="combobox"
            aria-expanded={open}
            className="justify-between w-full "
            disabled={isLoading || node.isrelay}
          >
            <div className="flex items-center justify-between flex-1 gap-2">
              <div className="flex items-center w-full min-w-0 gap-2">
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
                    <span className="w-full truncate">{displayGateway.name}</span>
                    <button onClick={handleUnassignClick} className="p-1 rounded-full hover:bg-bg-hover">
                      <XMarkIcon className="w-3 h-3 text-text-primary" />
                    </button>
                  </>
                ) : (
                  'Assign Gateway'
                )}
              </div>
              <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] bg-bg-contrastDefault text-text-primary p-0">
          <Command>
            <CommandInput placeholder="Search gateways" />
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
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {notifyCtx}
    </>
  );
}
