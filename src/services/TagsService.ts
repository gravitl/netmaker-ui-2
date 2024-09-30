import { Tag } from '@/models/Tags';
import { ApiRoutes } from '../constants/ApiRoutes';
import { Network } from '../models/Network';
import { axiosService } from './BaseService';
import { CreateTagReqDto } from './dtos/TagsDto';
import { GenericResponseDto } from './dtos/GenericDto';

function createTag(payload: CreateTagReqDto) {
  return axiosService.post<GenericResponseDto<Tag>>(`${ApiRoutes.TAGS}`, payload);
}

function getTagsPerNetwork(networkId: Network['netid']) {
  return axiosService.get<GenericResponseDto<Tag[]>>(`${ApiRoutes.TAGS}?network=${encodeURIComponent(networkId)}`);
}

function updateTag(tagId: Tag['id'], payload: Tag) {
  return axiosService.put<GenericResponseDto<Tag>>(`${ApiRoutes.TAGS}/${encodeURIComponent(tagId)}`, payload);
}

function deleteTag(tag: Tag['id']) {
  return axiosService.delete<void>(`${ApiRoutes.TAGS}?tag=${encodeURIComponent(tag)}`);
}

export const TagsService = {
  createTag,
  getTagsPerNetwork,
  updateTag,
  deleteTag,
};
