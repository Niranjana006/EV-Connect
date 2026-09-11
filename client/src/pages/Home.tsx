import React from 'react';

  const Home: React.FC = () => {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to EVConnect!</h1>
        <p className="text-lg">
          Your one-stop app for finding EV charging stations, connecting with the community, and exploring maps.
        </p>
      </div>
    );
  };

  export default Home;