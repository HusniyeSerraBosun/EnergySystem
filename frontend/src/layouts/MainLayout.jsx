import React, { useState } from 'react'; 
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const MainLayout = ({ children }) => {
  //default open menu
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // turn on/off function
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fa' }}>
      {/* Topbar */}
      <Topbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />
      
      {/* content area - expansion feature */}
      <div style={{ 
        
        paddingLeft: isSidebarOpen ? '294px' : '30px', 
        paddingRight: '30px',
        paddingTop: '100px',
        paddingBottom: '30px',
        transition: 'padding-left 0.3s ease-in-out' 
      }}>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;