import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import NoteList from './NoteList';
import { useAppStore } from '../../store/useStore';

describe('NoteList', () => {
  it('keeps note creation scoped to an active notebook', () => {
    useAppStore.setState({
      darkMode: true,
      lang: 'en',
      notes: [],
      activeNoteId: null,
      notebooks: [],
      activeNotebookId: null,
    });

    render(<NoteList />);

    expect(screen.queryByText('All Notes')).toBeNull();
    expect(screen.getByRole('button', { name: 'New' })).toHaveProperty('disabled', true);
  });
});
