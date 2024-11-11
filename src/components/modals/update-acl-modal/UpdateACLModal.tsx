import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Network } from '@/models/Network';
import { ACLRule } from '@/services/dtos/ACLDtos';
import UpdateUsersForm from './UpdateUsersForm';
import UpdateRessourcesForm from './UpdateRessourcesForm';
import { NotificationInstance } from 'antd/es/notification/interface';

interface UpdateACLModalProps {
  isOpen: boolean;
  onClose: () => void;
  networkId: Network['netid'];
  selectedPolicy: ACLRule | null;
  fetchACLRules: () => void;
  reloadACL: () => void;
  notify: NotificationInstance;
}

const UpdateACLModal: React.FC<UpdateACLModalProps> = ({
  isOpen,
  onClose,
  networkId,
  selectedPolicy,
  fetchACLRules,
  reloadACL,
  notify,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#141414] bg-opacity-50" onClick={handleOverlayClick}>
      <div className="flex items-center justify-center min-h-full p-4" onClick={handleOverlayClick}>
        <div
          className="relative w-full max-w-[620px] bg-bg-default border border-stroke-default rounded-xl"
          onClick={handleDialogClick}
        >
          <div className="flex items-start justify-between w-full gap-6 py-6 pl-8 pr-3 border-b border-stroke-default bg-bg-default rounded-t-xl">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl text-text-primary">Update {`${selectedPolicy?.name} Policy` || '<p></p>olicy'}</h2>{' '}
              <p className="text-text-secondary">Use this policy to restrict access for resources and users.</p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex p-2 rounded-full hover:bg-opacity-50 hover:bg-button-outline-fill-hover"
            >
              <XMarkIcon className="w-5 h-5 text-button-outline-text-default" />
            </button>
          </div>
          <div className="flex w-full px-8 py-6">
            <div className="flex flex-col w-full gap-2">
              {selectedPolicy?.policy_type === 'user-policy' ? (
                <UpdateUsersForm
                  networkId={networkId}
                  onClose={onClose}
                  fetchACLRules={fetchACLRules}
                  selectedPolicy={selectedPolicy}
                  reloadACL={reloadACL}
                  notify={notify}
                />
              ) : selectedPolicy?.policy_type === 'device-policy' ? (
                <UpdateRessourcesForm
                  networkId={networkId}
                  fetchACLRules={fetchACLRules}
                  onClose={onClose}
                  selectedPolicy={selectedPolicy}
                  reloadACL={reloadACL}
                  notify={notify}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateACLModal;
