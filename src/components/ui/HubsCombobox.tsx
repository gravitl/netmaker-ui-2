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

export function HubsCombobox({
  hubs,
  node,
  networkId,
  onUpdate,
}: {
  hubs: ExtendedNode[];
  node: ExtendedNode;
  networkId: string;
  onUpdate?: () => void;
}) {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHub, setSelectedHub] = useState<ExtendedNode | null>(null);

  const [notify, notifyCtx] = notification.useNotification();

  const currentHub = useMemo(() => {
    if (node.static_node?.ingressgatewayid) {
      return hubs.find((hub) => hub.id === node.static_node?.ingressgatewayid);
    }
    if (node.relayedby) {
      return hubs.find((hub) => hub.id === node.relayedby);
    }
    return null;
  }, [node, hubs]);

  const isHubSelectable = useCallback(
    (hub: ExtendedNode): boolean => {
      if (hub.id === node.id) return false;
      if (node.isrelay) return false;
      return true;
    },
    [node.id, node.isrelay],
  );

  useEffect(() => {
    setSelectedHub(currentHub ?? null);
  }, [currentHub]);

  const handleReassign = async (oldHub: ExtendedNode, newHub: ExtendedNode) => {
    setIsLoading(true);
    setOpen(false);

    try {
      const oldRelayedNodes = new Set([...(oldHub.relaynodes ?? [])]);
      oldRelayedNodes.delete(node.id);
      await NodesService.updateNode(oldHub.id, networkId, {
        ...oldHub,
        relaynodes: [...oldRelayedNodes],
      });

      const newRelayedNodes = new Set([...(newHub.relaynodes ?? [])]);
      newRelayedNodes.add(node.id);
      await NodesService.updateNode(newHub.id, networkId, {
        ...newHub,
        relaynodes: [...newRelayedNodes],
      });

      setSelectedHub(newHub);
      await store.fetchNodes();
      if (onUpdate) {
        onUpdate();
      }
      notify.success({ message: 'Hub reassigned successfully' });
    } catch (err) {
      notify.error({ message: `Can't reassign hub` });
      setSelectedHub(oldHub);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!selectedHub) return;

    setIsLoading(true);
    setOpen(false);

    try {
      const relayedNodes = new Set([...(selectedHub.relaynodes ?? [])]);
      relayedNodes.delete(node.id);

      await NodesService.updateNode(selectedHub.id, networkId, {
        ...selectedHub,
        relaynodes: [...relayedNodes],
      });

      setSelectedHub(null);
      await store.fetchNodes();
      if (onUpdate) {
        onUpdate();
      }
      notify.success({ message: `Hub unassigned successfully` });
    } catch (err) {
      notify.error({ message: `Can't unassign hub` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: 'Confirm Unassign',
      content: 'Are you sure you want to unassign this hub?',
      okText: 'Yes, unassign',
      cancelText: 'Cancel',
      onOk: handleUnassign,
    });
  };

  const handleSelect = async (hubName: string) => {
    setOpen(false);

    const newHub = hubs.find((hub) => hub.name === hubName);
    if (!newHub || newHub.id === selectedHub?.id || !isHubSelectable(newHub)) return;

    if (currentHub) {
      Modal.confirm({
        title: 'Confirm Reassign',
        content: `Are you sure you want to reassign from ${currentHub.name} to ${newHub.name}?`,
        okText: 'Yes, reassign',
        cancelText: 'Cancel',
        onOk: () => handleReassign(currentHub, newHub),
      });
      return;
    }

    setIsLoading(true);
    try {
      const relayedNodes = new Set([...(newHub.relaynodes ?? [])]);
      relayedNodes.add(node.id);

      await NodesService.updateNode(newHub.id, networkId, {
        ...newHub,
        relaynodes: [...relayedNodes],
      });

      setSelectedHub(newHub);
      await store.fetchNodes();
      if (onUpdate) {
        onUpdate();
      }
      notify.success({ message: 'Hub assigned successfully' });
    } catch (err) {
      notify.error({ message: `Can't assign hub` });
    } finally {
      setIsLoading(false);
    }
  };

  const displayHub = isLoading ? selectedHub : selectedHub || currentHub;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            role="combobox"
            aria-expanded={open}
            className="justify-between w-full"
            disabled={isLoading || node.isrelay}
          >
            <div className="flex items-center justify-between flex-1 gap-2">
              <div className="flex items-center w-full min-w-0 gap-2">
                {isLoading ? (
                  <>
                    <LoadingOutlined spin />
                    <span>Updating...</span>
                  </>
                ) : displayHub ? (
                  <>
                    <span
                      className="flex-shrink-0 w-2 h-2 rounded-full"
                      style={{
                        background: getTextColor(displayHub.connected ? 'connected' : 'disconnected'),
                      }}
                    />
                    <span className="w-full truncate">{displayHub.name}</span>
                    <button onClick={handleUnassignClick} className="p-1 rounded-full hover:bg-bg-hover">
                      <XMarkIcon className="w-3 h-3 text-text-primary" />
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
                {hubs.map((hub) => {
                  const isSelectable = isHubSelectable(hub);
                  return (
                    <CommandItem
                      key={hub.name}
                      value={hub.name}
                      onSelect={handleSelect}
                      className={cn('flex items-center gap-1', !isSelectable && 'opacity-50 cursor-not-allowed')}
                      disabled={!isSelectable || isLoading}
                    >
                      <CheckCircleIcon
                        className={cn('mr-2 h-4 w-4', displayHub?.id === hub.id ? 'opacity-100' : 'opacity-0')}
                      />
                      <span
                        className="w-2 h-2 rounded-full text-nowrap whitespace-nowrap"
                        style={{
                          background: getTextColor(hub.connected ? 'connected' : 'disconnected'),
                        }}
                      />
                      <span className="flex-1">{hub.name}</span>
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
