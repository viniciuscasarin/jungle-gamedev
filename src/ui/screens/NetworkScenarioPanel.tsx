import { useEffect, useState, type ChangeEvent } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import {
  NETWORK_SCENARIOS,
  getNetworkScenario,
  getScenarioDefinition,
  setNetworkScenario,
  resetMockData,
  onScenarioChange,
  type NetworkScenarioId,
} from '../../mocks/scenarios';
import './MainMenu.css';

export interface NetworkScenarioPanelProps {
  client?: QueryClient | undefined;
}

export function NetworkScenarioPanel({ client }: NetworkScenarioPanelProps) {
  const [scenario, setScenario] = useState<NetworkScenarioId>(() => getNetworkScenario());
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    // Keep local state synced if URL, storage, or external trigger changes the scenario
    const unsubscribe = onScenarioChange(updatedScenario => {
      setScenario(updatedScenario);
    });
    return unsubscribe;
  }, []);

  const handleScenarioChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextScenario = e.target.value as NetworkScenarioId;
    setNetworkScenario(nextScenario);
    setScenario(nextScenario);
    const def = getScenarioDefinition(nextScenario);
    setStatusMessage(`Active network scenario set to: ${def.name}.`);
  };

  const handleResetData = () => {
    resetMockData(client);
    setStatusMessage('Mock data reset to canonical fixtures.');
  };

  const handleRestoreDefault = () => {
    setNetworkScenario('default');
    setScenario('default');
    setStatusMessage('Restored default network scenario.');
  };

  const currentDef = getScenarioDefinition(scenario);

  return (
    <details className="network-scenario-panel">
      <summary className="network-scenario-summary">Network Diagnostics &amp; Scenarios</summary>
      <div className="network-scenario-body">
        <div className="network-scenario-field">
          <label htmlFor="network-scenario-select">Active Scenario:</label>
          <select
            id="network-scenario-select"
            className="network-scenario-select"
            value={scenario}
            onChange={handleScenarioChange}
          >
            {NETWORK_SCENARIOS.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="network-scenario-info" aria-label="Scenario details">
          <span className="network-scenario-badge">{scenario}</span>
          <p className="network-scenario-desc">{currentDef.description}</p>
        </div>

        <div className="network-scenario-actions">
          <button type="button" className="secondary reset-mock-button" onClick={handleResetData}>
            Reset Mock Data
          </button>
          {scenario !== 'default' && (
            <button
              type="button"
              className="secondary restore-default-button"
              onClick={handleRestoreDefault}
            >
              Restore Default Scenario
            </button>
          )}
        </div>

        <p className="network-scenario-status" role="status" aria-live="polite">
          {statusMessage}
        </p>
      </div>
    </details>
  );
}
