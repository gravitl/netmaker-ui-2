import { ExtendedNode } from '@/models/Node';
import { useStore } from '@/store/store';
import { getExtendedNode, getNodeConnectivityStatus, isHostNatted } from '@/utils/NodeUtils';
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Form, FormInstance } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { AddClientFormFields } from './ConfigFileTab';

const AdvancedSettings = ({ form }: { form: FormInstance<AddClientFormFields> }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    form.setFieldsValue({ is_internet_gw: false });
  }, [form]);

  return (
    <div className="flex flex-col gap-7">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-left text-text-primary"
      >
        <motion.div animate={{ rotate: isExpanded ? 45 : 0 }} transition={{ duration: 0.3 }}>
          <PlusIcon className="w-4 h-4 text-text-primary" />
        </motion.div>
        <h3 className="text-sm-semibold">Advanced settings</h3>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col gap-2">
              <Form.Item name={'publickey'} className="flex flex-col gap-2">
                <label htmlFor="public-key" className="block text-text-primary text-sm-semibold">
                  Public Key (Optional)
                </label>
                <input
                  type="text"
                  id="publickey"
                  placeholder="e.g. siyutbHgRd5WSroVs0lWQztJ7JbUcXiC99eV51qt91E="
                  className="w-full p-2 text-sm border rounded-lg bg-bg-default border-stroke-default"
                  onChange={(e) => form.setFieldValue('publickey', e.target.value)}
                />
              </Form.Item>
              <Form.Item name={'extclientdns'} className="flex flex-col gap-2">
                <label htmlFor="dns" className="block text-text-primary text-sm-semibold">
                  DNS (Optional)
                </label>
                <input
                  type="text"
                  id="dns"
                  placeholder="e.g. 8.8.8.8"
                  className="w-full p-2 text-sm border rounded-lg bg-bg-default border-stroke-default"
                  onChange={(e) => form.setFieldValue('extclientdns', e.target.value)}
                />
              </Form.Item>
              <Form.Item name={'postup'} className="flex flex-col gap-2">
                <label htmlFor="postup" className="block text-text-primary text-sm-semibold">
                  Post Up (Optional)
                </label>
                <input
                  type="text"
                  id="postup"
                  placeholder="Post Up script"
                  className="w-full p-2 text-sm border rounded-lg bg-bg-default border-stroke-default"
                  onChange={(e) => form.setFieldValue('postup', e.target.value)}
                />
              </Form.Item>
              <Form.Item name={'postdown'} className="flex flex-col gap-2">
                <label htmlFor="postdown" className="block text-text-primary text-sm-semibold">
                  Post Down (Optional)
                </label>
                <input
                  type="text"
                  id="postdown"
                  placeholder="Post Down script"
                  className="w-full p-2 text-sm border rounded-lg bg-bg-default border-stroke-default"
                  onChange={(e) => form.setFieldValue('postdown', e.target.value)}
                />
              </Form.Item>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ConfigFileFormProps {
  networkId: string;
  form: FormInstance<AddClientFormFields>;
}

const ConfigFileForm = ({ networkId, form }: ConfigFileFormProps) => {
  const [isGatewayDropdownOpen, setIsGatewayDropdownOpen] = useState(false);
  const [gatewaySearch, setGatewaySearch] = useState('');
  const [selectedHost, setSelectedHost] = useState<ExtendedNode | null>(null);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const store = useStore();

  const networkHosts = useMemo(() => {
    return store.nodes
      .filter((node) => node.network === networkId)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkId, store.hostsCommonDetails, store.nodes]);

  const filteredNetworkHosts = useMemo(() => {
    return networkHosts.filter(
      (node) =>
        node.name?.toLowerCase().includes(gatewaySearch.toLowerCase()) ||
        node.address?.toLowerCase().includes(gatewaySearch.toLowerCase()),
    );
  }, [networkHosts, gatewaySearch]);

  const handleHostSelect = (host: ExtendedNode) => {
    setIsGatewayDropdownOpen(false);
    setSelectedHost(host);
    form.setFieldsValue({ gatewayId: host.id });
  };

  useEffect(() => {
    // This effect ensures the form is updated when selectedHost changes
    if (selectedHost) {
      form.setFieldsValue({ gatewayId: selectedHost.id });
    }
  }, [selectedHost, form]);

  const getNodeConnectivity = (node: ExtendedNode) => {
    const status = getNodeConnectivityStatus(node);
    switch (status) {
      case 'error':
        return <span className="text-red-500">Error</span>;
      case 'warning':
        return <span className="text-yellow-500">Unstable</span>;
      case 'online':
        return <span className="text-green-500">Healthy</span>;
      default:
        return <span className="text-gray-500">Unknown</span>;
    }
  };

  return (
    <div className="z-20">
      <div className="flex flex-col px-8 py-6 border-b gap-7 border-stroke-default">
        <button
          onClick={() => setIsConfigExpanded(!isConfigExpanded)}
          className="flex items-center gap-2 text-left text-text-primary"
        >
          <motion.div animate={{ rotate: isConfigExpanded ? 90 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronRightIcon className="w-4 h-4" />
          </motion.div>
          <DocumentIcon className="w-4 h-4 text-text-primary" />
          <h3 className="text-sm-semibold">Create a config file</h3>
        </button>
        <AnimatePresence initial={false}>
          {isConfigExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-2">
                <Form.Item name="clientid" rules={[{ required: true, message: 'Please input the node name' }]}>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="node-name" className="block text-text-primary text-sm-semibold">
                      Node name
                    </label>
                    <input
                      type="text"
                      id="node-name"
                      placeholder="e.g. red-mystic"
                      className="w-full p-2 text-sm border rounded-lg bg-bg-default border-stroke-default"
                    />
                  </div>
                </Form.Item>

                <Form.Item name="gatewayId" rules={[{ required: true, message: 'Please select a host' }]}>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="gateway" className="block text-text-primary text-sm-semibold">
                      Select node as gateway
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsGatewayDropdownOpen(!isGatewayDropdownOpen)}
                        className="flex items-center justify-between w-full p-2 text-sm border rounded-lg bg-bg-default border-stroke-default"
                      >
                        <span>{selectedHost ? selectedHost.name : 'Select a host'}</span>
                        <ChevronDownIcon className="w-4 h-4" />
                      </button>
                      {isGatewayDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg bg-bg-default border-stroke-default">
                          <div className="p-2">
                            <input
                              type="text"
                              placeholder="Search host"
                              value={gatewaySearch}
                              onChange={(e) => setGatewaySearch(e.target.value)}
                              className="w-full p-2 mb-2 text-sm border rounded-lg bg-bg-default border-stroke-default"
                            />
                            <div className="overflow-y-auto max-h-48">
                              {filteredNetworkHosts.map((node) => (
                                <div
                                  key={node.id}
                                  onClick={() => handleHostSelect(node)}
                                  className="flex items-center justify-between p-2 cursor-pointer hover:bg-bg-hover"
                                >
                                  <span>{node.name}</span>
                                  <span>{getNodeConnectivity(node)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Form.Item>

                {selectedHost && (
                  <div className="p-2 border rounded-lg border-stroke-default">
                    <div className="flex items-center justify-between">
                      <span>{selectedHost.name}</span>
                      <span>
                        {selectedHost.isingressgateway ? (
                          <span className="text-green-500">Gateway</span>
                        ) : (
                          <span className="text-green-500">New Gateway</span>
                        )}
                      </span>
                      <span>{getNodeConnectivity(selectedHost)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          form.setFieldsValue({ gatewayId: undefined });
                          setSelectedHost(null);
                        }}
                        className="p-1 rounded-full hover:bg-red-100"
                      >
                        <XMarkIcon className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
                {selectedHost && !selectedHost.isingressgateway && (
                  <div className="p-2 text-blue-800 bg-blue-100 border border-blue-300 rounded-lg">
                    This host will be turned into a gateway when you create the config.
                  </div>
                )}
                {selectedHost && isHostNatted(selectedHost as any) && (
                  <div className="p-2 text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg">
                    The selected host is behind a NAT gateway, which may affect reachability.
                  </div>
                )}
                <AdvancedSettings form={form} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConfigFileForm;
