import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/Dialog';
import { DocumentIcon, ServerIcon } from '@heroicons/react/24/solid';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/shadcn/Form';
import { Tag } from '@/models/Tags';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/shadcn/Input';
import { Button } from '@/components/shadcn/Button';
import { MultiSelect } from '@/components/shadcn/MultiSelect';
import { ExtendedNode, Node } from '@/models/Node';
import { TagsService } from '@/services/TagsService';
import { Network } from '@/models/Network';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { notification } from 'antd';
import { useCallback, useState } from 'react';
import { NULL_NODE } from '@/constants/Types';
import { deduceNodeId } from '@/utils/NodeUtils';
import { useStore } from '@/store/store';

interface AddTagModalProps {
  isOpen: boolean;
  onCreateTag?: (newTag: Tag) => void;
  onCancel?: () => void;
  nodes: ExtendedNode[];
  networkId: Network['netid'];
}

const createTagFormSchema = z.object({
  tag_name: z
    .string()
    .min(3)
    .max(50)
    .trim()
    .regex(/^[a-zA-Z0-9-]+$/, 'Tag name can only contain characters A-Z, a-z, 0-9 and -'),
});

export default function AddTagModal({ isOpen, nodes, networkId, onCancel, onCreateTag }: Readonly<AddTagModalProps>) {
  const store = useStore();
  const currentTheme = store.currentTheme;
  const form = useForm<z.infer<typeof createTagFormSchema>>({
    resolver: zodResolver(createTagFormSchema),
    defaultValues: {
      tag_name: '',
    },
  });

  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

  const resetModal = useCallback(() => {
    form.reset();
    setSelectedNodes([]);
  }, [form]);

  const handleCreateTag = async (values: z.infer<typeof createTagFormSchema>) => {
    try {
      const newTag: Tag = (await TagsService.createTag({ ...values, tagged_nodes: selectedNodes, network: networkId }))
        .data.Response;
      onCreateTag?.(newTag);
      notification.success({
        message: `Tag created successfully with name ${newTag.tag_name}`,
      });
      resetModal();
    } catch (err) {
      notification.error({
        message: 'Failed to create tag',
        description: extractErrorMsg(err as any),
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetModal();
          onCancel?.();
        }
      }}
    >
      <DialogContent
        className="border-stroke-default"
        style={{
          backgroundColor: currentTheme === 'dark' ? 'var(--color-bg-default-dark)' : 'var(--color-bg-default)',
        }}
      >
        {/* <DialogClose>
          <XCircleIcon className="w-6 h-6 p-2 rounded-full text-text-secondary" />
          hello
        </DialogClose> */}
        <DialogHeader>
          <DialogTitle
            style={{
              color: currentTheme === 'dark' ? 'var(--color-text-primary-dark)' : 'var(--color-neutral-800)',
            }}
          >
            Create New Tag
          </DialogTitle>
          <DialogDescription className="text-base text-text-secondary">Tags group nodes</DialogDescription>
        </DialogHeader>

        <hr className="border-stroke-default" />

        <div className="w-100">
          <Form {...form}>
            <form className="space-y-8">
              <FormField
                control={form.control}
                name="tag_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className="text-base-semibold"
                      style={{
                        color: currentTheme === 'dark' ? 'var(--color-text-primary-dark)' : 'var(--color-neutral-800)',
                      }}
                    >
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A name for your tag"
                        style={{
                          backgroundColor:
                            currentTheme === 'dark' ? 'var(--color-bg-default-dark)' : 'var(--color-bg-default)',
                          color:
                            currentTheme === 'dark' ? 'var(--color-text-primary-dark)' : 'var(--color-neutral-800)',
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-yellow-500" />
                  </FormItem>
                )}
              />
              <FormLabel
                className="inline-block text-base-semibold"
                style={{
                  marginTop: '2rem',
                  marginBottom: '1rem',
                  color: currentTheme === 'dark' ? 'var(--color-text-primary-dark)' : 'var(--color-neutral-800)',
                }}
              >
                Grouped Devices
              </FormLabel>
              <MultiSelect
                options={nodes
                  .filter((n) => !n.is_user_node)
                  .toSorted((a, b) =>
                    (a?.name || a.static_node.clientid).localeCompare(b?.name || b.static_node.clientid),
                  )
                  .map((node) => ({
                    label: (node.is_static ? node.static_node.clientid : node.name) || '',
                    value: deduceNodeId(node),
                    icon: node.is_static ? DocumentIcon : ServerIcon,
                  }))}
                onValueChange={(vals) => {
                  setSelectedNodes(
                    vals.map(
                      (val) => nodes.find((node) => node.id === val || node.static_node.clientid === val) ?? NULL_NODE,
                    ),
                  );
                }}
                variant="default"
                placeholder="Search for devices"
                className="bg-default-dark border-stroke-default"
                currentTheme={currentTheme}
                style={{
                  marginTop: '0rem',
                  backgroundColor: currentTheme === 'dark' ? 'var(--color-bg-default-dark)' : 'var(--color-bg-default)',
                  color: currentTheme === 'dark' ? 'var(--color-text-primary-dark)' : 'var(--color-neutral-800)',
                }}
              />
            </form>
          </Form>
        </div>

        <hr className="border-stroke-default" />

        <DialogFooter>
          {/* <Button
            variant="secondary"
            className="border border-stroke-default"
            onClick={() => {
              form.reset();
              onCancel?.();
            }}
          >
            Cancel
          </Button> */}
          <Button
            type="submit"
            className="border-stroke-default bg-button-primary-fill-default"
            onClick={() => {
              console.log('clicked');
              form.handleSubmit(handleCreateTag, () => {})();
            }}
          >
            Create Tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
