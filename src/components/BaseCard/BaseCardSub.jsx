import React from 'react';
import './BaseCard.css';
import BaseCardSubText from './BaseCardSubText';
import BaseCardSubMultimedia from './BaseCardSubMultimedia';

function BaseCardSub({ data, tabId, nodeId }) {
  return (
    <div className="card-sub-div">
      <BaseCardSubText data={data} tabId={tabId} nodeId={nodeId} />
      <BaseCardSubMultimedia data={data} tabId={tabId} nodeId={nodeId} />
    </div>
  );
}

export default BaseCardSub;