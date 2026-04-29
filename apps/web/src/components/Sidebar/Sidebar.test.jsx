import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';
import { useAppStore } from '../../store/useStore';
import { createNotebook } from '../../utils/notebooks';

describe('Sidebar', () => {
  it('shows the active notebook mnemonic instead of a stale global mnemonic', () => {
    const activeNotebook = createNotebook({
      id: 'nb-work',
      name: 'Work',
      mnemonic: 'test test test test test test test test test test test ball',
    });

    useAppStore.setState({
      darkMode: true,
      lang: 'en',
      mnemonic: 'old old old old old old old old old old old old',
      members: [],
      showSidebar: true,
      showQRCode: false,
      showHistory: false,
      history: [],
      notebooks: [activeNotebook],
      activeNotebookId: activeNotebook.id,
    });

    render(<Sidebar socketId="socket-1" />);

    expect(screen.getByText(activeNotebook.mnemonic)).not.toBeNull();
    expect(screen.queryByText('old old old old old old old old old old old old')).toBeNull();
  });
});
