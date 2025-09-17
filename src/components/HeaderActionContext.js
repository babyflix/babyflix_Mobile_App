import React, { createContext, useContext, useState } from 'react';

const HeaderActionContext = createContext();

export const useHeaderAction = () => useContext(HeaderActionContext);

export const HeaderActionProvider = ({ children }) => {
  const [handleChooseClick, setHandleChooseClick] = useState(null);

  return (
    <HeaderActionContext.Provider value={{ handleChooseClick, setHandleChooseClick }}>
      {children}
    </HeaderActionContext.Provider>
  );
};
