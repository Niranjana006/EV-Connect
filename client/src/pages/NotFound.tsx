import React from 'react';

  const NotFound: React.FC = () => {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
        <p>Sorry, this page doesn't exist.</p>
      </div>
    );
  };

  export default NotFound;