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

  const handleUpdateTag = async () => {
    try {
      const newTag: Tag = (await TagsService.updateTag({ ...tag, tagged_nodes: selectedNodes })).data.Response;
      onUpdateTag?.(newTag ?? { ...tag, tagged_nodes: selectedNodes, used_by_count: selectedNodes.length });
      notification.success({
        message: `Tag created successfully with name ${newTag?.tag_name}`,
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
      <DialogContent className="border-stroke-default" style={{ backgroundColor: '#27272A' }}>
        {/* <DialogClose>
          <XCircleIcon className="w-6 h-6 p-2 rounded-full text-text-secondary" />
          hello
        </DialogClose> */}
        <DialogHeader>
          <DialogTitle className="text-xl">Update Tag</DialogTitle>
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
                    <FormLabel className="text-base-semibold">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A name for your tag"
                        className="color-bg-default-dark"
                        style={{ backgroundColor: '#27272A' }}
                        disabled
                        title="Tag name cannot be updated"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-yellow-500" />
                  </FormItem>
                )}
              />
              <FormLabel
                className="inline-block text-base-semibold"
                style={{ marginTop: '2rem', marginBottom: '1rem' }}
              >
                Grouped Devices
              </FormLabel>
              <MultiSelect
                options={nodes.map((node) => ({
                  label: node.name ?? '',
                  value: node.id,
                }))}
                onValueChange={(vals) => {
                  setSelectedNodes(vals.map((val) => nodes.find((node) => node.id === val) ?? NULL_NODE));
                }}
                defaultValue={(tag?.tagged_nodes ?? []).map((node) => node.id)}
                variant="default"
                placeholder="Search for devices"
                className="bg-default-dark border-stroke-default"
                style={{ backgroundColor: '#27272A', marginTop: '0rem' }}
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
