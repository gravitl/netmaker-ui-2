import { Input } from '@/components/shadcn/Input';
import { Network } from '@/models/Network';
import { Tag } from '@/models/Tags';
import { TagsService } from '@/services/TagsService';
import { ComputerIcon, FileIcon, PlusIcon, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button as AntdButton,
  Col,
  Dropdown,
  MenuProps,
  Modal,
  notification,
  Row,
  Table,
  TableColumnsType,
  theme,
  Typography,
} from 'antd';
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { AxiosError } from 'axios';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { Button } from '@/components/shadcn/Button';
import AddTagModal from '@/components/modals/add-tag-modal/AddTagModal';
import { ExtendedNode } from '@/models/Node';
import UpdateTagModal from '@/components/modals/update-tag-modal/UpdateTagModal';
import { Badge } from '@/components/shadcn/Badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/shadcn/HoverCard';
import { getExtendedNode } from '@/utils/NodeUtils';
import { useStore } from '@/store/store';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { DocumentIcon, EllipsisHorizontalIcon, HashtagIcon, ServerIcon } from '@heroicons/react/24/solid';
import { NULL_HOST } from '@/constants/Types';
import { Host } from '@/models/Host';
import { useServerLicense, useBranding, useGetActiveNetwork } from '@/utils/Utils';
import { useParams } from 'react-router-dom';
import PageLayout from '@/layouts/PageLayout';

interface NetworkTagsPageProps {
  isFullScreen?: boolean;
  networkId?: Network['netid'];
  // networkNodes: ExtendedNode[];
}

export function NetworkTagsPage({ isFullScreen }: Readonly<NetworkTagsPageProps>) {
  const store = useStore();
  const storeFetchNodes = store.fetchNodes;
  const { networkId } = useParams<{ networkId: string }>();
  const resolvedNetworkId = networkId || store.activeNetwork;
  const { isServerEE } = useServerLicense();
  const branding = useBranding();
  const { network, isLoadingNetwork } = useGetActiveNetwork(resolvedNetworkId);
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();

  const [tags, setTags] = useState<Tag[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [isEditTagModalOpen, setIsEditTagModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => getExtendedNode(node, store.hostsCommonDetails))
        .filter((node) => node.network === resolvedNetworkId),
    [store.nodes, store.hostsCommonDetails, resolvedNetworkId],
  );

  const networkHosts = useMemo(() => {
    const hostsMap = new Map<Host['id'], Host>();
    store.hosts.forEach((host) => {
      hostsMap.set(host.id, host);
    });
    return store.nodes
      .filter((node) => node.network === networkId)
      .map((node) => hostsMap.get(node.hostid) ?? NULL_HOST);
  }, [networkId, store.hosts, store.nodes]);

  const openEditTagModal = useCallback((tag: Tag) => {
    setSelectedTag(tag);
    setIsEditTagModalOpen(true);
  }, []);

  const closeEditTagModal = useCallback(() => {
    setSelectedTag(null);
    setIsEditTagModalOpen(false);
  }, []);

  const confirmRemoveTag = useCallback(
    (tag: Tag) => {
      Modal.confirm({
        title: `Delete ${tag.tag_name}`,
        content: `Are you sure you want to remove this tag?`,
        onOk: async () => {
          try {
            await TagsService.deleteTag(tag);
            setTags((prev) => prev.filter((k) => k.id !== tag.id));
            notify.success({
              message: 'Tag removed',
              description: `Tag "${tag.tag_name}" has been removed`,
            });
          } catch (err) {
            if (err instanceof AxiosError) {
              notify.error({
                message: 'Error removing key',
                description: extractErrorMsg(err),
              });
            }
          }
        },
      });
    },
    [notify],
  );

  const tableColumns: TableColumnsType<Tag> = [
    {
      title: 'Tag Name',
      dataIndex: 'tag_name',
      render: (value, tag) => (
        <Typography.Link
          onClick={() => {
            setSelectedTag(tag);
            openEditTagModal(tag);
          }}
        >
          {value}
        </Typography.Link>
      ),
      sorter(a, b) {
        return a.tag_name.localeCompare(b.tag_name);
      },
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Used By',
      dataIndex: 'used_by_count',
      render: (val, tag) => {
        return (
          <HoverCard>
            <HoverCardTrigger>
              <Badge className="rounded px-2 py-1.5 bg-bg-default border border-stroke-default">
                <ServerIcon className="inline w-4 mr-2" /> {val === 1 ? `1 node` : `${val} nodes`}
              </Badge>
            </HoverCardTrigger>
            {tag.tagged_nodes.length > 0 && (
              <HoverCardContent className="border-none min-w-fit w-fit">
                <div className="m-2 overflow-y-auto border rounded bg-bg-default border-stroke-default max-h-80">
                  {tag.tagged_nodes
                    .toSorted((a, b) =>
                      (getExtendedNode(a, store.hostsCommonDetails).name || a.static_node.clientid).localeCompare(
                        getExtendedNode(b, store.hostsCommonDetails).name || b.static_node.clientid,
                      ),
                    )
                    .map((node, i) => (
                      <div key={`node-${i}`} className="p-1 text-sm font-bold break-keep whitespace-nowrap">
                        {!node.is_static && (
                          <>
                            <ServerIcon className="inline w-4 mr-2" />{' '}
                            {getExtendedNode(node, store.hostsCommonDetails).name}
                          </>
                        )}
                        {node.is_static && (
                          <>
                            <DocumentIcon className="inline w-4 mr-2" /> {node.static_node.clientid}
                          </>
                        )}
                      </div>
                    ))}
                </div>
              </HoverCardContent>
            )}
          </HoverCard>
        );
      },
    },
    {
      title: 'Created By',
      dataIndex: 'created_by',
    },
    {
      width: '1rem',
      render(_, tag) {
        return (
          <Dropdown
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: 'edit',
                  label: (
                    <Typography.Text>
                      <EditOutlined /> Edit Tag
                    </Typography.Text>
                  ),
                  onClick: (info) => {
                    info.domEvent.stopPropagation();
                    openEditTagModal(tag);
                  },
                },
                {
                  key: 'delete',
                  label: (
                    <Typography.Text type="danger">
                      <DeleteOutlined /> Delete Tag
                    </Typography.Text>
                  ),
                  onClick: (info) => {
                    info.domEvent.stopPropagation();
                    confirmRemoveTag(tag);
                  },
                },
              ] as MenuProps['items'],
            }}
          >
            <AntdButton
              type="text"
              icon={
                <div className="rounded-md p-1/2 shrink-0 outline outline-stroke-default bg-bg-default hover:bg-bg-hover ">
                  <EllipsisHorizontalIcon className="w-6 h-6 text-text-primary" />
                </div>
              }
              onClick={(ev) => {
                ev.stopPropagation();
              }}
            />
          </Dropdown>
        );
      },
    },
  ];

  const filteredTags = useMemo(
    () =>
      tags.filter((tag) => {
        return [tag.tag_name, tag.id].join('').toLowerCase().includes(searchText.toLowerCase());
      }),
    [tags, searchText],
  );

  const loadTags = useCallback(async () => {
    try {
      setIsLoadingTags(true);
      const tags = (await TagsService.getTagsPerNetwork(resolvedNetworkId)).data.Response;
      setTags(tags);
    } catch (err) {
      // TODO: notify with new toast component
      console.error(err);
    } finally {
      setIsLoadingTags(false);
    }
  }, [resolvedNetworkId]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return (
    <PageLayout
      title="Tag Manager"
      isFullScreen
      description={
        <>
          Organize and categorize network resources with a flexible tagging system.
          <br />
          Streamline resource management and automate policies based on custom tags.
        </>
      }
      icon={<HashtagIcon className=" size-5" />}
    >
      <div className="w-100 columns-2">
        <Input
          type="search"
          placeholder="Search for Tags"
          className="w-80 border-bg-default bg-bg-default"
          startIcon={Search}
          onChange={(ev) => setSearchText(ev.target.value)}
          value={searchText}
        />
        <Button
          className="bg-button-primary-fill-default text-text-primary light:invert float-end"
          onClick={() => setIsAddTagModalOpen(true)}
        >
          <PlusIcon className="inline mr-2" />
          Add Tag
        </Button>
      </div>

      <br />

      <div className="w-100">
        <Table
          columns={tableColumns}
          dataSource={filteredTags}
          rowKey="id"
          size="small"
          loading={isLoadingTags}
          scroll={{ x: true }}
          pagination={{ size: 'small', hideOnSinglePage: true, pageSize: 20 }}
          onRow={(key) => {
            return {
              // onClick: () => {
              //   setSelectedTag(key);
              //   setIsEditTagModalOpen(true);
              // },
            };
          }}
        />

        {/* TODO: refactor into tag mgmt table component */}
        {/* <Table className="bg-bg-contrastDefault">
          <TableHeader>
            <TableRow className="border-b-stroke-default">
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Used By</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-b-stroke-default">
              <TableCell className="">Servers</TableCell>
              <TableCell>
                <Label className="bg-bg-contrastDefault border border-stroke-default py-1.5 p-2 rounded font-semibold">
                  2 nodes
                </Label>
              </TableCell>
              <TableCell>aceix</TableCell>
              <TableCell className="text-right">
                <Button variant="secondary" className="bg-bg-default">
                  <EllipsisVerticalIcon />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow className="border-b-stroke-default">
              <TableCell className="">Servers</TableCell>
              <TableCell>
                <Label className="bg-bg-contrastDefault border border-stroke-default py-1.5 p-2 rounded font-semibold">
                  1 nodes
                </Label>
              </TableCell>
              <TableCell>aceix</TableCell>
              <TableCell className="text-right">
                <Button variant="secondary" className="bg-bg-default">
                  <EllipsisVerticalIcon />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow className="border-b-stroke-default">
              <TableCell className="">Servers</TableCell>
              <TableCell>
                <Label className="bg-bg-contrastDefault border border-stroke-default py-1.5 p-2 rounded font-semibold">
                  0 nodes
                </Label>
              </TableCell>
              <TableCell>aceix</TableCell>
              <TableCell className="text-right">
                <Button variant="secondary" className="bg-bg-default">
                  <EllipsisVerticalIcon />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table> */}
      </div>

      {/* misc */}
      {notifyCtx}
      <AddTagModal
        isOpen={isAddTagModalOpen}
        nodes={networkNodes}
        networkId={resolvedNetworkId}
        onCancel={() => {
          setIsAddTagModalOpen(false);
        }}
        onCreateTag={(tag: Tag) => {
          setTags((prev) => [...prev, tag]);
          setIsAddTagModalOpen(false);
        }}
      />
      {selectedTag && (
        <UpdateTagModal
          isOpen={isEditTagModalOpen}
          tag={selectedTag}
          networkId={resolvedNetworkId}
          onCancel={closeEditTagModal}
          onUpdateTag={(tag) => {
            setTags((prev) => prev.map((k) => (k.id === tag.id ? tag : k)));
            closeEditTagModal();
          }}
          nodes={networkNodes}
          key={`update-tag-${selectedTag.id}`}
        />
      )}
    </PageLayout>
  );
}
