import React from 'react';
import ReactDOM from 'react-dom/client';
import App, { ThemeProvider, DataProvider, GithubGistProvider } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Не вдалося знайти кореневий елемент для монтування");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <DataProvider>
        <GithubGistProvider>
            <App />
        </GithubGistProvider>
      </DataProvider>
    </ThemeProvider>
  </React.StrictMode>
);