import { Badge } from '@/components/shadcn/Badge';
import { Button } from '@/components/shadcn/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/Dialog';
import { Input } from '@/components/shadcn/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/Table';
import { Network } from '@/models/Network';
import { Tag } from '@/models/Tags';
import { TagsService } from '@/services/TagsService';
import { EllipsisVertical, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shadcn/Form';

interface TagManagementPageProps {
  network: Network['netid'];
}

const createTagFormSchema = z.object({
  name: z.string().min(3).max(50),
  devices: z.array(z.string()),
});

export function TagManagementPage({ network: networkId }: TagManagementPageProps) {
  const [tags, setTags] = useState<Tag[]>([]);

  const form = useForm<z.infer<typeof createTagFormSchema>>({
    resolver: zodResolver(createTagFormSchema),
    defaultValues: {
      name: '',
      devices: [],
    },
  });

  function onSubmit(values: z.infer<typeof createTagFormSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }

  const loadTags = useCallback(async () => {
    try {
      const tags = (await TagsService.getTagsPerNetwork(networkId)).data.Response;
      setTags(tags);
    } catch (err) {
      // TODO: notify with new toast component
      console.error(err);
    }
  }, [networkId]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return (
    <div className="" style={{ width: '100%' }}>
      {/* <div className="w-100">
        <span>
          My Network / <em>Tag Management</em>
        </span>
      </div> */}

      <div className="w-100 columns-2">
        <h3>Tag Management</h3>
        <div className="w-50 text-right">
          <Button className="btn">Docs</Button>
          <Button className="btn">Tour Tag Management</Button>
        </div>
      </div>

      <div className="w-100">
        <span className="text">
          Organize and categorize your resources efficiently with customizable tags. Apply tags to instances and other
          assets for improved resource management.
        </span>
      </div>

      <div className="w-100 columns-2">
        <Input type="search" placeholder="Search for Tags" className="w-80" startIcon={Search} />

        {/* TODO: refactor to separate component */}
        <Dialog>
          <DialogTrigger className="float-right">Add Tag</DialogTrigger>
          <DialogContent className="bg-gray-600">
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
              <DialogDescription>Tags group nodes</DialogDescription>
            </DialogHeader>
            <hr />
            <div className="w-100">
              <Form {...form}>
                <form className="space-y-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="A name for your tag" {...field} />
                        </FormControl>
                        {/* <FormDescription>This is your public display name.</FormDescription> */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="devices"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grouped Devices</FormLabel>
                        <FormControl>
                          <Input placeholder="Search for devices" {...field} />
                        </FormControl>
                        {/* <FormDescription>This is your public display name.</FormDescription> */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
            <hr />
            <DialogFooter>
              <Button variant="secondary" onClick={() => form.reset()}>
                Cancel
              </Button>
              <Button type="submit" onClick={() => form.handleSubmit(onSubmit)}>
                Create Tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-100">
        {/* TODO: refactor into tag mgmt table component */}
        <Table className="bg-bg-contrastDefault">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Used By</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="">Servers</TableCell>
              <TableCell>
                <Badge variant="secondary">9 nodes</Badge>
              </TableCell>
              <TableCell>aceix</TableCell>
              <TableCell className="text-right">
                <Button variant="secondary" className="bg-bg-default w-2 h-2">
                  <EllipsisVertical />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* misc */}
    </div>
  );
}
