import React from 'react';
import { ComputerDesktopIcon, UsersIcon, XMarkIcon } from '@heroicons/react/24/solid';
import UsersForm from './UsersForm';
import ResourcesForm from './RessourcesForm';
import { Network } from '@/models/Network';

interface AddACLModalProps {
  isOpen: boolean;
  onClose: () => void;
  networkId: Network['netid'];
  fetchACLRules: () => void;
}

const AddACLModal: React.FC<AddACLModalProps> = ({ isOpen, onClose, networkId, fetchACLRules }) => {
  const [policyType, setPolicyType] = React.useState('Resources');

  const policyTypes = [
    { name: 'Resources', icon: ComputerDesktopIcon },
    { name: 'Users', icon: UsersIcon },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#141414] bg-opacity-50">
      <div className="flex items-center justify-center min-h-full p-4">
        <div className="relative w-full max-w-[620px] bg-bg-default border border-stroke-default rounded-xl">
          <div className="flex items-start justify-between w-full gap-6 py-6 pl-8 pr-3 border-b border-stroke-default bg-bg-default rounded-t-xl">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl text-text-primary">Create new access control policy</h2>
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
              <label htmlFor="public-key" className="block text-text-primary text-sm-semibold">
                Policy for
              </label>
              <div className="flex mb-4">
                {policyTypes.map((filter) => (
                  <button
                    key={filter.name}
                    onClick={() => setPolicyType(filter.name)}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors duration-200 ${
                      policyType === filter.name
                        ? 'bg-button-secondary-fill-default text-text-primary'
                        : 'bg-transparent text-text-secondary hover:bg-button-secondary-fill-hover'
                    }`}
                  >
                    {filter.icon && <filter.icon className="flex-shrink-0 w-4 h-4" />}
                    <span className="whitespace-nowrap">{filter.name}</span>
                  </button>
                ))}
              </div>
              {policyType === 'Users' && (
                <UsersForm networkId={networkId} onClose={onClose} fetchACLRules={fetchACLRules} />
              )}
              {policyType === 'Resources' && (
                <ResourcesForm networkId={networkId} onClose={onClose} fetchACLRules={fetchACLRules} />
              )}{' '}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddACLModal;
