import { configureStore } from '@reduxjs/toolkit';
import instructorReducer, { fetchInstructors } from './instructorSlice';
import { instructorService } from '../../services/instructorService';

// Mock the service
jest.mock('../../services/instructorService');

describe('instructorSlice thunks', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        instructors: instructorReducer,
      },
    });
  });

  it('should handle fetchInstructors success', async () => {
    const mockInstructors = [{ id: '1', name: 'Dr. Smith' }];
    instructorService.fetchAllInstructors.mockResolvedValue(mockInstructors);

    await store.dispatch(fetchInstructors());

    const state = store.getState().instructors;
    expect(state.status).toEqual('succeeded');
    expect(state.allIds).toContain('1');
    expect(state.byId['1']).toEqual(mockInstructors[0]);
  });

  it('should handle fetchInstructors failure', async () => {
    const errorMsg = 'Network Error';
    instructorService.fetchAllInstructors.mockRejectedValue(new Error(errorMsg));

    await store.dispatch(fetchInstructors());

    const state = store.getState().instructors;
    expect(state.status).toEqual('failed');
    expect(state.error).toEqual(errorMsg);
  });
});
