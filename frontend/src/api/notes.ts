import { ApiError, apiRequest } from './http';
import type { CreateNoteInput, Note } from './types';

export function parseNote(data: unknown): Note {
  if (!data || typeof data !== 'object' || typeof (data as Note).id !== 'string') {
    throw new ApiError(500, 'invalid_response', 'Note response was missing an id.');
  }
  return data as Note;
}

export async function createNote(runId: string, input: CreateNoteInput, signal?: AbortSignal): Promise<Note> {
  const data = await apiRequest<unknown>(`/runs/${encodeURIComponent(runId)}/notes`, {
    method: 'POST',
    json: input,
    signal,
  });
  return parseNote(data);
}

export function deleteNote(noteId: string, signal?: AbortSignal): Promise<void> {
  return apiRequest<void>(`/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE', signal });
}
