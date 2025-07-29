import React from 'react';

interface LinkButtonProps {
  href: string;
  icon?: string;
  children: React.ReactNode;
  key?: string | number;
}

const LinkButton: React.FC<LinkButtonProps> = ({ href, icon, children, ...props }) => {
  return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center py-[0.25rem]"
        {...props}
      >
        <div className='inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 hover:border-blue-300 transition-all duration-200 mx-1 shadow-sm hover:shadow-md transform hover:scale-105'>
          <span>{icon}</span>
          <span>{children}</span>
          <span className="text-xs opacity-60">↗</span>
        </div>
      </a>
  );

};

export default LinkButton;
