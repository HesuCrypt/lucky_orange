/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dashboard } from './components/Dashboard';
import { LocaleProvider } from './context/LocaleContext';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <LocaleProvider>
        <Dashboard />
      </LocaleProvider>
    </ErrorBoundary>
  );
}

