import authReducer, { setUser, logoutUser } from './authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    isAuthenticated: false,
    status: 'idle',
    error: null,
  };

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setUser', () => {
    const user = { uid: '123', email: 'test@test.com', role: 'student' };
    const actual = authReducer(initialState, setUser(user));
    expect(actual.user).toEqual(user);
    expect(actual.isAuthenticated).toEqual(true);
    expect(actual.status).toEqual('succeeded');
  });

  it('should handle logoutUser.fulfilled', () => {
    const loggedInState = {
      user: { uid: '123' },
      isAuthenticated: true,
      status: 'succeeded',
      error: null,
    };
    const actual = authReducer(loggedInState, logoutUser.fulfilled());
    expect(actual).toEqual(initialState);
  });
});
