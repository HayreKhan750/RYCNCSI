import React, { createContext, useContext, useMemo, useState } from 'react';

const MfaContext = createContext(null);

export function MfaProvider({ children }) {
  const [resolver, setResolver] = useState(null); // MultiFactorResolver from Firebase

  const value = useMemo(() => ({ resolver, setResolver }), [resolver]);
  return <MfaContext.Provider value={value}>{children}</MfaContext.Provider>;
}

export const useMfa = () => useContext(MfaContext);
