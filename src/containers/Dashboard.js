import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Nav,
  NavItem,
  NavLink,
  Row,
  Col,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import Attendance from '../components/Attendance';
import Device from '../components/Device';
import User from '../components/User';
import RealtimeAttendance from '../components/RealtimeAttendance';
import './Dashboard.css';

const { ipcRenderer } = window.require('electron');

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalDevices: 0,
    totalUsers: 0,
    totalAttendance: 0,
    activeDevices: 0
  });

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    const currentLang = i18n.language;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: '◆' },
    { id: 'attendance', label: t('nav.attendance'), icon: '▣' },
    { id: 'realtime', label: t('nav.realtime'), icon: '●' },
    { id: 'users', label: t('nav.users'), icon: '⚉' },
    { id: 'devices', label: t('nav.devices'), icon: '▦' },
  ];

  // Fetch stats when dashboard view is active
  useEffect(() => {
    if (activeView === 'dashboard') {
      fetchStats();
    }
  }, [activeView]);

  const fetchStats = async () => {
    try {
      const devices = await ipcRenderer.invoke('fetch-all-devices');
      setStats({
        totalDevices: devices?.length || 0,
        totalUsers: 0, // Will be updated when we have user data
        totalAttendance: 0, // Will be updated when we have attendance data
        activeDevices: devices?.filter(d => d.type === 'staff' || d.type === 'student')?.length || 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'attendance':
        return <Attendance goBackButton={() => setActiveView('dashboard')} />;
      case 'devices':
        return <Device goBackButton={() => setActiveView('dashboard')} />;
      case 'users':
        return <User goBackButton={() => setActiveView('dashboard')} />;
      case 'realtime':
        return <RealtimeAttendance goBackButton={() => setActiveView('dashboard')} />;
      case 'dashboard':
      default:
        return (
          <div className="dashboard-home">
            <h2>{t('app.subtitle')}</h2>
            <p className="text-muted mb-4">{t('dashboard.welcome')}</p>

            {/* Stats Cards */}
            <Row className="g-3 mb-4">
              <Col lg="3" md="6">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#3182ce15' }}>
                    <span style={{ color: '#3182ce' }}>▦</span>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.totalDevices}</div>
                    <div className="stat-label">{t('dashboard.stats.totalDevices')}</div>
                  </div>
                </div>
              </Col>
              <Col lg="3" md="6">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#38a16915' }}>
                    <span style={{ color: '#38a169' }}>●</span>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.activeDevices}</div>
                    <div className="stat-label">{t('dashboard.stats.activeDevices')}</div>
                  </div>
                </div>
              </Col>
              <Col lg="3" md="6">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#d6942815' }}>
                    <span style={{ color: '#d69428' }}>⚉</span>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">{t('dashboard.stats.totalUsers')}</div>
                  </div>
                </div>
              </Col>
              <Col lg="3" md="6">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#805ad515' }}>
                    <span style={{ color: '#805ad5' }}>▣</span>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.totalAttendance}</div>
                    <div className="stat-label">{t('dashboard.stats.recordsToday')}</div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Navigation Cards */}
            <h5 className="mb-3">{t('dashboard.quickAccess')}</h5>
            <Row className="g-4">
              {menuItems.slice(1).map((item) => (
                <Col lg="3" md="6" key={item.id}>
                  <div
                    className="dashboard-card"
                    onClick={() => setActiveView(item.id)}
                  >
                    <div className="card-icon">{item.icon}</div>
                    <h5>{item.label}</h5>
                    <p>{t('dashboard.access', { name: item.label.toLowerCase() })}</p>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h4>{!sidebarCollapsed && t('app.title')}</h4>
          <button
            className="toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '☰' : '←'}
          </button>
        </div>

        <Nav vertical className="sidebar-nav">
          {menuItems.map((item) => (
            <NavItem key={item.id}>
              <NavLink
                className={activeView === item.id ? 'active' : ''}
                onClick={() => setActiveView(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            </NavItem>
          ))}
        </Nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="language-switcher">
              <UncontrolledDropdown>
                <DropdownToggle
                  caret
                  size="sm"
                  color="light"
                  className="w-100"
                >
                  {i18n.language === 'ar' ? 'العربية' : 'English'}
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem onClick={() => changeLanguage('en')}>
                    English
                  </DropdownItem>
                  <DropdownItem onClick={() => changeLanguage('ar')}>
                    العربية
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <Container fluid>
          {renderContent()}
        </Container>
      </div>
    </div>
  );
};

export default Dashboard;
