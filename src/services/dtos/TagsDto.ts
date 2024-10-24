import { Node } from '@/models/Node';
import { Tag } from '@/models/Tags';

export interface CreateTagReqDto {
  tag_name: string;
  network: Tag['network'];
  tagged_nodes: Node[];
}

export type TagListRespDto = Tag & {
  used_by_count: number;
  tagged_nodes: Node[];
};

export type UpdateTagReqDto = Tag & {
  newName: string;
  taggedNodes: string[];
};
