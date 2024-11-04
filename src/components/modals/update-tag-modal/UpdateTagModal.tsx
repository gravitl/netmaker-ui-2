import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/shadcn/Form';
import { Tag } from '@/models/Tags';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/shadcn/Input';
import { Button } from '@/components/shadcn/Button';
import { FileIcon, ServerIcon } from 'lucide-react';
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

interface UpdateTagModalProps {
  isOpen: boolean;
  tag: Tag;
  onUpdateTag?: (newTag: Tag) => void;
  onCancel?: () => void;
  nodes: ExtendedNode[];
  networkId: Network['netid'];
}

const updateTagFormSchema = z.object({
  tag_name: z.string().min(3).max(50),
});

export default function UpdateTagModal({ isOpen, tag, nodes, onCancel, onUpdateTag }: Readonly<UpdateTagModalProps>) {
  const store = useStore();
  const currentTheme = store.currentTheme;
  const form = useForm<z.infer<typeof updateTagFormSchema>>({
    resolver: zodResolver(updateTagFormSchema),
    defaultValues: tag,
  });

  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

  const resetModal = useCallback(() => {
    form.reset();
    setSelectedNodes([]);
  }, [form]);

  const handleUpdateTag = async (fields: z.infer<typeof updateTagFormSchema>) => {
    try {
      const newTag: Tag = (
        await TagsService.updateTag({
          ...tag,
          // tag_name: fields.tag_name,
          tagged_nodes: selectedNodes,
        })
      ).data.Response;
      onUpdateTag?.(newTag ?? { ...tag, tagged_nodes: selectedNodes, used_by_count: selectedNodes.length });
      notification.success({
        message: `Tag updated successfully with name ${newTag?.tag_name}`,
      });
      resetModal();
    } catch (err) {
      notification.error({
        message: 'Failed to update tag',
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
          <XCircleIcon className="w-6 h-6 text-text-secondary rounded-full p-2" />
          hello
        </DialogClose> */}
        <DialogHeader>
          <DialogTitle
            className="text-xl"
            style={{
              color: currentTheme === 'dark' ? 'var(--color-text-primary-dark)' : 'var(--color-neutral-800)',
            }}
          >
            Update Tag
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
                        className="color-bg-default-dark"
                        disabled
                        title="Tag name cannot be updated"
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
                className="text-base-semibold inline-block"
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
                  .toSorted((a, b) =>
                    (a?.name || a.static_node.clientid).localeCompare(b?.name || b.static_node.clientid),
                  )
                  .map((node) => ({
                    label: (node.is_static ? node.static_node.clientid : node.name) || '',
                    value: deduceNodeId(node),
                    icon: node.is_static ? FileIcon : ServerIcon,
                  }))}
                onValueChange={(vals) => {
                  console.log(vals);
                  setSelectedNodes(
                    vals.map(
                      (val) => nodes.find((node) => node.id === val || node.static_node.clientid === val) ?? NULL_NODE,
                    ),
                  );
                }}
                defaultValue={(tag?.tagged_nodes ?? []).map((node) => deduceNodeId(node))}
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
              form.handleSubmit(handleUpdateTag, () => {})();
            }}
          >
            Update Tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
