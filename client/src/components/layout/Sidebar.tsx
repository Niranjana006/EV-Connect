import React from 'react';
  import { NavLink } from 'react-router-dom';

  const Sidebar: React.FC = () => {
    return (
      <div className="w-64 bg-gray-100 p-4">
        <h2 className="text-xl font-bold mb-4">Menu</h2>
        <ul>
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 font-bold' : 'text-gray-600'
              }
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/charging"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 font-bold' : 'text-gray-600'
              }
            >
              Charging
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/community"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 font-bold' : 'text-gray-600'
              }
            >
              Community
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 font-bold' : 'text-gray-600'
              }
            >
              Map
            </NavLink>
          </li>
        </ul>
      </div>
    );
  };

  export default Sidebar;