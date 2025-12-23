import React, { useState, useEffect } from 'react';
import { Navbar, Container, Nav, Dropdown } from 'react-bootstrap';
import { FaBars, FaExpand, FaUser, FaSignOutAlt, FaCompress } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ toggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // user info state
  const [userInfo, setUserInfo] = useState({ username: '', role: '' });

  // get information from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('username') || 'Misafir';
    const storedRole = localStorage.getItem('role') || '-';
    
    setUserInfo({
      username: storedUsername,
      role: storedRole
    });
  }, []);

  // fullscreen function
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // logout function 
  const handleLogout = () => {
    // clear all datas
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('org_id');
    
    navigate('/'); // return to login page
  };

  return (
    <Navbar bg="white" fixed="top" style={{ 
      height: '70px', 
      paddingLeft: isSidebarOpen ? '264px' : '0', 
      boxShadow: '0 1px 15px rgba(0,0,0,0.04)',
      zIndex: 900,
      transition: 'padding-left 0.3s ease-in-out'
    }}>
      <Container fluid>
        {/* menu icon */}
        <Nav className="me-auto align-items-center">
           <div onClick={toggleSidebar} style={{cursor: 'pointer', padding: '10px'}}>
             <FaBars size={20} style={{color: '#3f4d67'}} />
           </div>
        </Nav>

        {/* fullscreen and profile */}
        <Nav className="ms-auto align-items-center">
          
          {/* fullscreen button */}
          <div 
            onClick={toggleFullScreen} 
            className="me-4 text-muted" 
            style={{cursor: 'pointer'}} 
            title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
          >
            {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
          </div>

          {/* profile menu */}
          <Dropdown align="end">
            <Dropdown.Toggle variant="light" id="dropdown-basic" style={{backgroundColor: 'transparent', border: 'none', padding: 0}} className="d-flex align-items-center">
              <div className="text-end me-2 d-none d-md-block">
                {/* username */}
                <span className="d-block text-dark fw-bold" style={{fontSize: '14px'}}>
                  {userInfo.username}
                </span>
                {/* user's role */}
                <small className="text-muted text-uppercase" style={{fontSize: '11px'}}>
                  {userInfo.role.replace('_', ' ')}
                </small>
              </div>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', 
                backgroundColor: '#e0e0e0', display:'flex', alignItems:'center', justifyContent:'center'
              }}>
                <FaUser color="#666" />
              </div>
            </Dropdown.Toggle>

            {/* logout */}
            <Dropdown.Menu style={{border: 'none', boxShadow: '0 5px 20px rgba(0,0,0,0.1)', marginTop: '10px'}}>
              <Dropdown.Item onClick={handleLogout} className="text-danger">
                <FaSignOutAlt className="me-2" /> Çıkış Yap
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

        </Nav>
      </Container>
    </Navbar>
  );
};

export default Topbar;