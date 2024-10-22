import { useState } from 'react';
import { Button, Form, notification } from 'antd';
import { useStore } from '@/store/store';
import { NodesService } from '@/services/NodesService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import ConfigFileForm from './ConfigFileForm';
import EgressForm from './EgressForm';
import { useServerLicense } from '@/utils/Utils';

export interface AddClientFormFields {
  clientid: string;
  gatewayId: string;
  publickey: string;
  extclientdns: string;
  postup: string;
  postdown: string;
  extraallowedips: string[];
  is_internet_gw: boolean;
}

const ConfigFileTab = ({ networkId, onClose }: { networkId: string; onClose: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const store = useStore();
  const [form] = Form.useForm<AddClientFormFields>();
  const [notify, notifyCtx] = notification.useNotification();
  const { isServerEE } = useServerLicense();

  const handleCreateConfig = async () => {
    try {
      setIsSubmitting(true);
      const values = await form.validateFields();

      if (!values.gatewayId) {
        throw new Error('No node selected');
      }

      const selectedHost = store.nodes.find((node) => node.id === values.gatewayId);

      if (!selectedHost) {
        throw new Error('Selected node not found');
      }

      let gatewayId = selectedHost.id;

      // Create ingress node (gateway) if it's not already one
      if (!selectedHost.isingressgateway) {
        const response = await NodesService.createIngressNode(selectedHost.id, networkId, {
          extclientdns: values.extclientdns,
          is_internet_gw: isServerEE ? values.is_internet_gw : false,
          metadata: '',
          mtu: 1500,
          persistentkeepalive: 20,
        });
        gatewayId = response.data.id; // Use the new gateway ID
        notify.success({ message: `Gateway created successfully` });
      }

      const configData = {
        clientid: values.clientid,
        publickey: values.publickey,
        extclientdns: values.extclientdns,
        extraallowedips: values.extraallowedips,
        postup: values.postup,
        postdown: values.postdown,
      };

      await NodesService.createExternalClient(gatewayId, networkId, configData);
      notify.success({ message: `Config file created` });

      // Reset the form after successful creation
      form.resetFields();
      onClose();
    } catch (error) {
      notify.error({
        message: 'Failed to create config',
        description: extractErrorMsg(error as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form form={form}>
      <div className="flex flex-col ">
        <ConfigFileForm networkId={networkId} form={form} />
        <EgressForm form={form} />

        <div className="z-0 flex justify-end m-5">
          <Button
            onClick={handleCreateConfig}
            disabled={isSubmitting}
            className={`text-sm font-semibold text-white rounded-lg ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-button-primary-fill-default hover:bg-button-primary-fill-hover'
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Config'}
          </Button>
        </div>
      </div>
      {notifyCtx}
    </Form>
  );
};

export default ConfigFileTab;
