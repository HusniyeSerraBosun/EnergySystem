import React, { useState, useEffect } from 'react';
import { FaIndustry, FaBolt, FaChartPie, FaHome, FaAngleDown, FaAngleRight, FaCircle } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { Collapse } from 'react-bootstrap';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [openSubMenu, setOpenSubMenu] = useState(null);

  // role reading
  const [userRole, setUserRole] = useState(() => {
    const role = localStorage.getItem('role') || localStorage.getItem('user_role') || '';
    console.log("Sidebar Yüklendi. Algılanan Rol:", role); // for checking
    return role;
  });

  // Link restriction based on role
  const restrictedPaths = ['/organization', '/plant', '/users'];

  const isRestricted = (path) => {
    //It returns true except for the super admin.
    return userRole !== 'super_admin' && restrictedPaths.includes(path);
  };

  //blocking and warning
  const handleRestrictedClick = (e) => {
    e.preventDefault(); 
    alert("Yetkiniz yoktur."); 
  };

  // menu config
  const getMenuConfig = () => {
    
    const assetSubMenus = [
      { title: 'Organizasyon İşlemleri', to: '/organization' },
      { title: 'Santral İşlemleri', to: '/plant' },
      { title: 'Santral Olayları', to: '/plant-events' }, // open to everyone
      { title: 'Kullanıcı İşlemleri', to: '/users' }
    ];

    return [
      {
        id: 'dashboard',
        title: 'Ana Sayfa',
        icon: <FaHome />,
        to: '/dashboard'
      },
      {
        id: 'asset',
        title: 'Varlık Yönetimi',
        icon: <FaIndustry />,
        subMenus: assetSubMenus
      },
      {
        id: 'generation',
        title: 'Üretim Ekranı',
        icon: <FaBolt />,
        to: '/uretim'
      },
      {
        id: 'transparency',
        title: 'Şeffaflık Platformu',
        icon: <FaChartPie />,
        subMenus: [
          { title: 'Tüketim Ekranı', to: '/consumption' },
          { title: 'Piyasa Ekranı', to: '/piyasa' } 
        ]
      }
    ];
  };

  const menuConfig = getMenuConfig();

  useEffect(() => {
    const activeParent = menuConfig.find(menu => 
      menu.subMenus && menu.subMenus.some(sub => sub.to === location.pathname)
    );
    if (activeParent) {
      setOpenSubMenu(activeParent.id);
    }
  }, [location.pathname]); /* */

  const toggleSubMenu = (id) => {
    setOpenSubMenu(openSubMenu === id ? null : id);
  };

  const isLinkActive = (to) => location.pathname === to;
  const isParentActive = (subMenus) => subMenus ? subMenus.some(sub => isLinkActive(sub.to)) : false;

  return (
    <div style={{
      width: '264px', height: '100vh', position: 'fixed', left: isOpen ? '0' : '-264px', top: 0,
      backgroundColor: '#404e67', zIndex: 1000, boxShadow: isOpen ? '2px 0 5px rgba(0,0,0,0.05)' : 'none',
      overflowY: 'auto', transition: 'left 0.3s ease-in-out',
    }}>
      <div style={{height: '70px', display: 'flex', alignItems: 'center', paddingLeft: '25px', backgroundColor: '#3a465b'}}>
        <h4 style={{color: 'white', fontWeight: 'bold', margin: 0}}>
          <span style={{color: '#01a9ac'}}>E</span>nergySys
        </h4>
      </div>

      <div className="p-3">
        <ul className="list-unstyled mt-3">
           {menuConfig.map((menu) => {
              const hasSubMenu = menu.subMenus && menu.subMenus.length > 0;
              const isActive = hasSubMenu ? isParentActive(menu.subMenus) : isLinkActive(menu.to);
              const isMenuOpen = openSubMenu === menu.id;

              return (
                <li key={menu.id} className="mb-1">
                  {hasSubMenu ? (
                    <>
                      <div 
                        onClick={() => toggleSubMenu(menu.id)}
                        className="sidebar-link"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 20px', cursor: 'pointer', transition: 'all 0.3s',
                          color: isActive || isMenuOpen ? '#fff' : '#b7c0cd',
                          backgroundColor: isActive ? '#384357' : 'transparent',
                          borderLeft: isActive ? '4px solid #01a9ac' : '4px solid transparent',
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <span style={{marginRight: '15px', fontSize: '18px'}}>{menu.icon}</span>
                          <span style={{fontSize: '14px', fontWeight: '600'}}>{menu.title}</span>
                        </div>
                        <span>{isMenuOpen ? <FaAngleDown /> : <FaAngleRight />}</span>
                      </div>

                      <Collapse in={isMenuOpen}>
                        <ul className="list-unstyled" style={{backgroundColor: '#333c4e'}}>
                          {menu.subMenus.map((subMenu, index) => {
                            
                            const restricted = isRestricted(subMenu.to); //link restriction control

                            return (
                              <li key={index}>
                                <Link 
                                  to={subMenu.to}

                                  onClick={(e) => restricted ? handleRestrictedClick(e) : null} //blocking if restricted
                                  
                                  style={{
                                    display: 'flex', alignItems: 'center',
                                    padding: '10px 20px 10px 55px',
                                    
                                    //forbidden link style settings
                                    color: isLinkActive(subMenu.to) ? '#01a9ac' : (restricted ? '#6c757d' : '#b7c0cd'), 
                                    
                                    textDecoration: 'none', 
                                    fontSize: '13px', 
                                    transition: 'all 0.2s',
                                    
                                    
                                    opacity: restricted ? 0.5 : 1, 
                                    
                                    
                                    cursor: restricted ? 'not-allowed' : 'pointer' 
                                  }}
                                  onMouseOver={(e) => !restricted && (e.currentTarget.style.color = '#fff')}
                                  onMouseOut={(e) => !restricted && (e.currentTarget.style.color = isLinkActive(subMenu.to) ? '#01a9ac' : '#b7c0cd')}
                                >
                                  <FaCircle size={6} style={{marginRight: '10px', opacity: 0.6}} />
                                  {subMenu.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </Collapse>
                    </>
                  ) : (
                    <Link 
                      to={menu.to}
                      className="sidebar-link"
                      style={{
                        display: 'flex', alignItems: 'center', padding: '12px 20px',
                        textDecoration: 'none', transition: 'all 0.3s',
                        color: isActive ? '#fff' : '#b7c0cd',
                        backgroundColor: isActive ? '#384357' : 'transparent',
                        borderLeft: isActive ? '4px solid #01a9ac' : '4px solid transparent',
                      }}
                    >
                      <span style={{marginRight: '15px', fontSize: '18px'}}>{menu.icon}</span>
                      <span style={{fontSize: '14px', fontWeight: '600'}}>{menu.title}</span>
                    </Link>
                  )}
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;