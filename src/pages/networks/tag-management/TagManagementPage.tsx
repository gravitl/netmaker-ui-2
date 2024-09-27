import { Button } from '@/components/shadcn/Button';
import { Input } from '@/components/shadcn/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/Table';

export function TagManagementPage() {
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
        <Input type="search" placeholder="Search for Tags" className="w-80" />
        <Button className="float-right">Add Tag</Button>
      </div>

      <div className="w-100">
        {/* TODO: refactor into tag mgmt table component */}
        <Table>
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
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
