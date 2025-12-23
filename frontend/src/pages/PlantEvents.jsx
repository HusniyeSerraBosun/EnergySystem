import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Card, Form, Button, Alert, Spinner, Table, Pagination, Row, Col, Badge } from 'react-bootstrap';
import { FaExclamationTriangle, FaCheckCircle, FaTools, FaHistory, FaStopCircle, FaBan } from 'react-icons/fa';
import axios from 'axios';

const PlantEvents = () => {
  const [userRole, setUserRole] = useState('');
  
  // viewMode: 'create' | 'list' | 'active'
  const [viewMode, setViewMode] = useState('list');
  
  const [plants, setPlants] = useState([]);
  const [events, setEvents] = useState([]);
  
  const [plantStats, setPlantStats] = useState({ total: 0, active: 0, passive: 0 });

  const [formData, setFormData] = useState({
    power_plant_id: '',
    event_type: 'Maintenance',
    reason: '',
    description: '',
    affected_capacity: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const role = localStorage.getItem('role') || localStorage.getItem('user_role') || 'analyst';
    setUserRole(role);

    // list mode for analyst
    if (role === 'analyst') {
      setViewMode('list');
    } else {
      // active mode for admin or super_admin
      setViewMode('active');
    }

    fetchPlants();
    fetchEvents(); 
  }, []);

  const fetchPlants = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:8000/plants/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const plantData = res.data || [];
      const sorted = plantData.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      setPlants(sorted);

      const total = plantData.length;
      const active = plantData.filter(p => p.current_status === 'Active').length;
      const passive = total - active;
      setPlantStats({ total, active, passive });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://127.0.0.1:8000/plant-events/', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Olaylar alınırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    // the analyst function cannot be run.
    if(userRole === 'analyst') {
       setError("Yetkisiz işlem! Analyst olay oluşturamaz.");
       return;
    }

    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        power_plant_id: parseInt(formData.power_plant_id),
        event_type: formData.event_type,
        reason: formData.reason,
        description: formData.description,
        affected_capacity: parseFloat(formData.affected_capacity)
      };

      await axios.post('http://127.0.0.1:8000/plant-events/create', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Olay başarıyla oluşturuldu!');
      setFormData({
        power_plant_id: '', event_type: 'Maintenance', reason: '', description: '', affected_capacity: ''
      });
      fetchPlants(); 
      fetchEvents();

    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('İşlem başarısız.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinishEvent = async (eventId) => {
    // extra security
    if(userRole === 'analyst') {
        setError("Yetkisiz işlem! Analyst olay sonlandıramaz.");
        return;
    }

    if(!window.confirm("Bu olayı sonlandırmak ve santrali tekrar 'Active' moda almak istediğinize emin misiniz?")) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://127.0.0.1:8000/plant-events/finish', { event_id: eventId }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Olay sonlandırıldı. Santral tekrar devreye alındı.');
      fetchPlants();
      fetchEvents(); 

    } catch (err) {
      console.error(err);
      setError("Olay sonlandırılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (mode) => {
    // analyst can only view the list, they cannot switch to other modes.
    if(userRole === 'analyst') return;

    setViewMode(mode);
    setError(null);
    setSuccess('');
    if (mode === 'list' || mode === 'active') {
      fetchEvents();
    }
  };

  const filteredEvents = viewMode === 'active' 
    ? events.filter(ev => ev.status === 'continue') 
    : events;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEvents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <MainLayout>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold text-dark mb-1">Santral Olay Yönetimi</h4>
          <span className="text-muted small">
            {userRole === 'analyst' 
              ? 'Tüm santral olay geçmişi ve durum listesi (İzleme Modu).' 
              : 'Bakım, arıza bildirimleri ve durum güncellemeleri.'}
          </span>
        </div>
        
        {userRole === 'analyst' && (
          <Badge bg="info" className="p-2">Analyst Modu</Badge>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success"><FaCheckCircle className="me-2"/>{success}</Alert>}

      <Row>
        {/* fullscreen for analyst ,split screen for admin*/}
        <Col lg={userRole === 'analyst' ? 12 : 8}>
          
          {/* form (admin-super_admin) */}
          {viewMode === 'create' && userRole !== 'analyst' && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white py-3 border-bottom-0">
                 <h6 className="mb-0 fw-bold text-danger">+ Yeni Olay Bildirimi (Arıza/Bakım)</h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Form onSubmit={handleCreate}>
                  <Row>
                    <Col md={12}>
                       <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">İLGİLİ SANTRAL</Form.Label>
                        <Form.Select 
                          value={formData.power_plant_id} 
                          onChange={(e) => setFormData({...formData, power_plant_id: e.target.value})} 
                          required
                        >
                          <option value="">Seçiniz...</option>
                          {plants.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.installed_capacity} MW) - [{p.current_status}]</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">OLAY TİPİ</Form.Label>
                        <Form.Select 
                          value={formData.event_type} 
                          onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                        >
                          <option value="Maintenance">Maintenance (Bakım)</option>
                          <option value="Failure">Failure (Arıza)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">ETKİLENEN KAPASİTE</Form.Label>
                        <Form.Control type="number" step="0.01" value={formData.affected_capacity} onChange={(e) => setFormData({...formData, affected_capacity: e.target.value})} required />
                      </Form.Group>
                    </Col>
                  </Row>

                   <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-muted small">SEBEP</Form.Label>
                    <Form.Control type="text" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} required />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-muted small">AÇIKLAMA</Form.Label>
                    <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}/>
                  </Form.Group>
                  <div className="d-flex justify-content-end">
                     <Button type="submit" disabled={loading} variant="danger">OLAYI BAŞLAT</Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* table for everyone */}
          {(viewMode === 'list' || viewMode === 'active') && (
             <Card className="border-0 shadow-sm">
             <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold text-muted">
                  {userRole === 'analyst' ? 'Tüm Olay Listesi' : (viewMode === 'active' ? 'Devam Eden Olaylar' : 'Tüm Olay Geçmişi')}
                </h6>
                <Badge bg="secondary">{filteredEvents.length} Kayıt</Badge>
             </Card.Header>
             <Card.Body className="p-0">
               {loading ? (
                 <div className="text-center p-5"><Spinner animation="border"/></div>
               ) : (
                 <>
                  <Table hover responsive className="mb-0 align-middle">
                    <thead style={{ backgroundColor: '#6c757d', color: '#ffffff' }}>
                      <tr>
                        <th className="ps-4">Santral</th>
                        <th>Tip</th>
                        <th>Kapasite</th>
                        <th>Başlangıç</th>
                        <th>Durum</th>
                        {/* column is hidden for analyst */}
                        {userRole !== 'analyst' && viewMode === 'active' && <th>İşlem</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((ev) => (
                          <tr key={ev.id}>
                            <td className="ps-4 fw-bold text-dark">{ev.plant_name}</td>
                            <td>
                              <Badge bg={ev.event_type === 'Failure' ? 'danger' : 'warning'} text="dark">
                                {ev.event_type}
                              </Badge>
                            </td>
                            <td className="text-danger fw-bold">-{ev.affected_capacity} MW</td>
                            <td className="small">{new Date(ev.start_time).toLocaleString('tr-TR')}</td>
                            <td>
                              {ev.status === 'continue' ? (
                                <Badge bg="success" className="p-2">Devam Ediyor</Badge>
                              ) : (
                                <Badge bg="secondary">Tamamlandı</Badge>
                              )}
                            </td>
                            {/* update button */}
                            {userRole !== 'analyst' && viewMode === 'active' && (
                              <td>
                                <Button size="sm" variant="outline-danger" onClick={() => handleFinishEvent(ev.id)}>
                                  <FaStopCircle className="me-1"/> Bitir
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">Kayıt bulunamadı.</td></tr>
                      )}
                    </tbody>
                  </Table>

                  {filteredEvents.length > itemsPerPage && (
                    <div className="d-flex justify-content-center py-3 bg-light border-top">
                      <Pagination size="sm">
                          {[...Array(totalPages)].map((_, i) => (
                            <Pagination.Item key={i+1} active={i+1 === currentPage} onClick={() => paginate(i+1)}>{i+1}</Pagination.Item>
                          ))}
                      </Pagination>
                    </div>
                  )}
                 </>
               )}
             </Card.Body>
           </Card>
          )}
        </Col>

        {/* control panel */}
        {userRole !== 'analyst' && (
          <Col lg={4}>
            <div className="d-grid gap-3 sticky-top" style={{top: '20px'}}>
              
              <Card className="border-0 shadow-sm text-white" style={{backgroundColor: '#404e67'}}>
                <Card.Body>
                  <h6 className="fw-bold mb-3 border-bottom border-secondary pb-2">Santral Durum Özeti</h6>
                  <div className="d-flex justify-content-between mb-2"><span>Toplam:</span><span className="fw-bold">{plantStats.total}</span></div>
                  <div className="d-flex justify-content-between mb-2"><span className="text-success"><FaCheckCircle className="me-2"/>Aktif:</span><span className="fw-bold text-success">{plantStats.active}</span></div>
                  <div className="d-flex justify-content-between"><span className="text-warning"><FaExclamationTriangle className="me-2"/>Olaylı:</span><span className="fw-bold text-warning">{plantStats.passive}</span></div>
                </Card.Body>
              </Card>

              <Button 
                variant={viewMode === 'create' ? "danger" : "outline-danger"} 
                size="lg" className="d-flex align-items-center justify-content-start p-3"
                onClick={() => handleViewChange('create')}
              >
                <FaExclamationTriangle className="me-3" size={24}/>
                <div className="text-start"><div className="fw-bold">Olay Bildir</div></div>
              </Button>

              <Button 
                variant={viewMode === 'list' ? "secondary" : "outline-secondary"} 
                size="lg" className="d-flex align-items-center justify-content-start p-3"
                onClick={() => handleViewChange('list')}
              >
                <FaHistory className="me-3" size={24}/>
                <div className="text-start"><div className="fw-bold">Olay Geçmişi</div></div>
              </Button>

              <Button 
                variant={viewMode === 'active' ? "primary" : "outline-primary"} 
                size="lg" className="d-flex align-items-center justify-content-start p-3"
                onClick={() => handleViewChange('active')}
              >
                <FaTools className="me-3" size={24}/>
                <div className="text-start"><div className="fw-bold">Durum Güncelle</div></div>
              </Button>

            </div>
          </Col>
        )}
      </Row>
    </MainLayout>
  );
};

export default PlantEvents;