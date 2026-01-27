// src/pages/Targets.jsx
import React, { useState } from 'react';
import TargetGroupForm from '../components/TargetGroupForm';
import TargetGroupList from '../components/TargetGroupList';
import TargetForm from '../components/TargetForm';
import TargetList from '../components/TargetList';

export default function TargetsPage() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupListKey, setGroupListKey] = useState(0);
  const [targetListKey, setTargetListKey] = useState(0);

  function handleGroupCreated() {
    setGroupListKey((k) => k + 1);
  }

  function handleTargetCreated() {
    setTargetListKey((k) => k + 1);
    handleGroupCreated(); // refresh counts
  }

  return (
    <div className="page page--targets">
      <h1>Targets</h1>

      <div className="layout-two-columns">
        <div className="col col--wide">
          <TargetGroupForm onCreated={handleGroupCreated} />
          <TargetGroupList
            key={groupListKey}
            onSelectGroup={(g) => {
              setSelectedGroup(g);
              setTargetListKey((k) => k + 1);
            }}
            onChanged={handleGroupCreated}
          />
        </div>
        <div className="col col--side">
          {selectedGroup ? (
            <>
              <h2>Group details</h2>
              <p>Name: {selectedGroup.name}</p>
              <p>Description: {selectedGroup.description}</p>
              <p>
                Active/total: {selectedGroup.activeTargets}/
                {selectedGroup.totalTargets}
              </p>

              <TargetForm group={selectedGroup} onCreated={handleTargetCreated} />
              <TargetList group={selectedGroup} reloadKey={targetListKey} />
            </>
          ) : (
            <p>Select a group to see details and manage its targets.</p>
          )}
        </div>
      </div>
    </div>
  );
}
