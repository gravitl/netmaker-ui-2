import { Node } from './Node';

export interface Tag {
  id: string;
  tag_name: string;
  network: string;
  tagged_nodes: Node[];
  used_by_count: number;
  created_by: string;
  created_at: Date;
}
