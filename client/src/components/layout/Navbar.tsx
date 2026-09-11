import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, signInWithGoogle, signUpWithEmail, logout, joinCommunity, leaveCommunity, isInCommunity } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignUp, setShowSignUp] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      try {
        await signUpWithEmail(email, password);
        console.log('Sign-up successful for:', email);
        setShowSignUp(false);
      } catch (error: any) {
        console.error('Sign-Up Error:', error);
        if (error.code === 'auth/email-already-in-use') {
          alert('This email is already in use. Try signing in or use a different email.');
        }
      }
    }
  };

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">EVConnect</Link>
        <div className="space-x-4 flex items-center">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/charging" className="hover:underline">Charging</Link>
          <Link to="/community" className="hover:underline">Community</Link>
          <Link to="/map" className="hover:underline">Map</Link>
          {user ? (
            <>
              <span className="text-sm">{user.displayName || user.email}</span>
              {isInCommunity ? (
                <button
                  onClick={leaveCommunity}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition duration-200"
                >
                  Leave Community
                </button>
              ) : (
                <button
                  onClick={joinCommunity}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition duration-200"
                >
                  Join Community
                </button>
              )}
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={signInWithGoogle}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition duration-200"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowSignUp(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition duration-200"
              >
                Sign Up
              </button>
              {showSignUp && (
                <form onSubmit={handleSignUp} className="flex space-x-2">
                  <input
                    type="email"
                    id="signup-email" // Added id
                    name="email" // Added name
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="border p-1 rounded text-black bg-white"
                  />
                  <input
                    type="password"
                    id="signup-password" // Added id
                    name="password" // Added name
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="border p-1 rounded text-black bg-white"
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignUp(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;