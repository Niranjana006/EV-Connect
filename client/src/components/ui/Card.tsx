import React from 'react';

  interface CardProps {
    children: React.ReactNode;
    className?: string;
  }

  const Card: React.FC<CardProps> = ({ children, className }) => {
    return (
      <div className={`border p-4 rounded-lg shadow-md ${className}`}>
        {children}
      </div>
    );
  };

  export default Card;