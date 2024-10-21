import { ChevronRightIcon, LinkIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Form, FormInstance } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
const EgressForm: React.FC<{ form: FormInstance }> = ({ form }) => {
  const [isEgressExpanded, setIsEgressExpanded] = useState(false);
  const [externalRoutes, setExternalRoutes] = useState<string[]>([]);

  const addExternalRoute = () => {
    setExternalRoutes([...externalRoutes, '']);
  };

  const handleRouteChange = (index: number, value: string) => {
    const updatedRoutes = [...externalRoutes];
    updatedRoutes[index] = value;
    setExternalRoutes(updatedRoutes);
    form.setFieldValue('extraallowedips', updatedRoutes);
  };

  const removeExternalRoute = (index: number) => {
    const updatedRoutes = externalRoutes.filter((_, i) => i !== index);
    setExternalRoutes(updatedRoutes);
    form.setFieldValue('extraallowedips', updatedRoutes);
  };

  return (
    <div className="flex flex-col gap-3 px-8 py-6 border-b border-stroke-default">
      <button
        onClick={() => setIsEgressExpanded(!isEgressExpanded)}
        className="flex items-center gap-2 text-left text-text-primary"
      >
        <motion.div animate={{ rotate: isEgressExpanded ? 90 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronRightIcon className="w-4 h-4" />
        </motion.div>
        <LinkIcon className="w-4 h-4 text-text-primary" />
        <h3 className="text-sm-semibold">Egress (Optional)</h3>
      </button>
      <AnimatePresence initial={false}>
        {isEgressExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-start gap-1 overflow-hidden"
          >
            <p className="mb-4 text-sm text-text-secondary">
              Enable devices in your network to communicate with other devices outside the network via Egress.
            </p>
            <AnimatePresence initial={false}>
              {externalRoutes.map((route, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full overflow-hidden"
                >
                  <Form.Item name={'extraallowedips'} className="flex flex-col justify-center">
                    <input
                      type="text"
                      value={route}
                      id="extraallowedips"
                      onChange={(e) => handleRouteChange(index, e.target.value)}
                      placeholder={`External Route ${index + 1} (e.g. 192.168.1.0/24)`}
                      className="items-center w-full p-2 pr-8 text-sm border rounded-lg bg-bg-default border-stroke-default"
                    />
                    <button
                      onClick={() => removeExternalRoute(index)}
                      className="absolute p-1 rounded-full right-2 hover:bg-bg-hover"
                    >
                      <XMarkIcon className="w-4 h-4 text-text-secondary" />
                    </button>
                  </Form.Item>
                </motion.div>
              ))}
            </AnimatePresence>
            <button
              onClick={addExternalRoute}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded text-text-secondary bg-button-plain-fill-default"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="text-sm-semibold">New external route</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default EgressForm;
