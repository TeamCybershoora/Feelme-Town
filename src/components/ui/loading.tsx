'use client';

import React from 'react';

const Loading = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000000',
      zIndex: 9999
    }}>
      {/* Empty loading page - ready for your video */}
    </div>
  );
};

export default Loading;