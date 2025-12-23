import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Card, Form, Button, Alert, Spinner, Table, Pagination, Row, Col, Badge } from 'react-bootstrap';
import { FaIndustry, FaList, FaCheckCircle, FaSave, FaBolt, FaBuilding, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const PlantOperations = () => {
  // url, mode control 
  const location = useLocation();
  const isReadOnly = location.pathname.includes('/list');

  // states
  const [isListView, setIsListView] = useState(isReadOnly ? true : false); 
  
  const [plantList, setPlantList] = useState([]);
  const [orgList, setOrgList] = useState([]);
  
  const [stats, setStats] = useState({ totalPlants: 0, totalOrgs: 0 });

  const [formData, setFormData] = useState({
    name: '', eic: '', installed_capacity: '', fuel_type: 'Doğalgaz',
    organization_name: '', is_yekdem: false, is_res: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInitialData();
    if (isReadOnly) setIsListView(true);
  }, [location.pathname]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      let plants = [];
      let orgs = [];

      
      if (isReadOnly) {
        // just see the power plants (Admin/Analyst)
        const resPlants = await axios.get('https://energysystem.onrender.com/plants/', { headers });
        plants = resPlants.data || [];
      } else {
        // for super admin
        const [resPlants, resOrgs] = await Promise.all([
          axios.get('https://energysystem.onrender.com/plants/', { headers }),
          axios.get('https://energysystem.onrender.com/organizations/', { headers })
        ]);
        plants = resPlants.data || [];
        orgs = resOrgs.data || [];
      }

      // sorting from a to z
      plants.sort((a, b) => (a.name || "").localeCompare(b.name || "", 'tr'));

      if(orgs.length > 0) {
        orgs.sort((a, b) => (a.name || "").localeCompare(b.name || "", 'tr'));
      }

      setPlantList(plants);
      setOrgList(orgs);
      
      setStats({
        totalPlants: plants.length,
        totalOrgs: orgs.length
      });
      
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        setError("Bu verileri görüntüleme yetkiniz yok.");
      } else {
        setError("Veriler yüklenirken bir sorun oluştu.");
      }
    } finally {
      setLoading(false);
    }
  };

  // kuruluş adı bulucu
  const getOrgNameById = (id) => {
    if (!orgList || orgList.length === 0) return '-';
    const org = orgList.find(o => o.id === id);
    return org ? org.name : '-';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      const params = {
        name: formData.name,
        eic: formData.eic,
        installed_capacity: formData.installed_capacity,
        fuel_type: formData.fuel_type,
        organization_name: formData.organization_name,
        is_yekdem: formData.is_yekdem,
        is_res: formData.is_res
      };

      await axios.post('https://energysystem.onrender.com/plants/', null, {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });

      setSuccess('Santral başarıyla oluşturuldu!');
      setFormData(prev => ({
        ...prev, name: '', eic: '', installed_capacity: '', is_yekdem: false, is_res: false
      }));
      
      fetchInitialData();

    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Kayıt başarısız. Lütfen bilgileri kontrol edin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = plantList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(plantList.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const excludedOrgs = ["testBir", "testİki", "System"];

  return (
    <MainLayout>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">
          {isReadOnly ? "Santral Listesi" : "Santral Yönetimi"}
        </h4>
        <span className="text-muted small">
          {isReadOnly 
            ? "Şirketinize ait kayıtlı santrallerin listesi." 
            : "Sisteme yeni üretim tesisi tanımlayın veya mevcutları yönetin."}
        </span>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success"><FaCheckCircle className="me-2"/>{success}</Alert>}

      <Row>
        <Col lg={isReadOnly ? 12 : 8}>
          {!isListView ? (
            // form (super admin)
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white py-3 border-bottom-0">
                 <h6 className="mb-0 fw-bold text-muted" style={{color: '#01a9ac'}}>+ Yeni Santral Ekle</h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Form onSubmit={handleCreate}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">SANTRAL ADI</Form.Label>
                        <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Örn: Atatürk Barajı" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">EIC KODU</Form.Label>
                        <Form.Control type="text" name="eic" value={formData.eic} onChange={handleInputChange} required placeholder="40X..." />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">KAYNAK TİPİ</Form.Label>
                        <Form.Select name="fuel_type" value={formData.fuel_type} onChange={handleInputChange}>
                          <option value="Doğalgaz">Doğalgaz</option>
                          <option value="Hidro">Hidroelektrik</option>
                          <option value="Rüzgar">Rüzgar</option>
                          <option value="Güneş">Güneş</option>
                          <option value="Kömür">Kömür</option>
                          <option value="Jeotermal">Jeotermal</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">KAPASİTE (MW)</Form.Label>
                        <Form.Control type="number" step="0.01" name="installed_capacity" value={formData.installed_capacity} onChange={handleInputChange} required placeholder="0" />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                       <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">BAĞLI OLDUĞU ORGANİZASYON</Form.Label>
                        <Form.Select name="organization_name" value={formData.organization_name} onChange={handleInputChange}>
                          <option value="">Seçiniz...</option>
                          {orgList
                            .filter(org => !excludedOrgs.includes(org.name))
                            .map(org => (
                              <option key={org.id} value={org.name}>{org.name}</option>
                            ))
                          }
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex gap-4 mt-2 mb-4">
                    <Form.Check type="checkbox" label="YEKDEM Kapsamında mı?" name="is_yekdem" checked={formData.is_yekdem} onChange={handleInputChange} />
                    <Form.Check type="checkbox" label="Yenilenebilir Enerji (RES) mi?" name="is_res" checked={formData.is_res} onChange={handleInputChange} />
                  </div>

                  <div className="d-flex justify-content-end">
                     <Button type="submit" disabled={loading} style={{backgroundColor: '#01a9ac', border: 'none', padding: '10px 30px', fontWeight: 'bold'}}>
                       {loading ? <Spinner size="sm" animation="border"/> : "KAYDET"}
                     </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          ) : (
            // table
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white py-3">
                 <h6 className="mb-0 fw-bold text-muted">Kayıtlı Santraller</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0 align-middle">
                  <thead style={{ backgroundColor: '#6c757d', color: '#ffffff' }}>
                    <tr>
                      <th className="ps-4">Santral Adı</th>
                      <th>Kaynak</th>
                      <th>Kapasite</th>
                      <th>EIC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((plant) => (
                        <tr key={plant.id}>
                          <td className="ps-4 fw-bold text-dark">{plant.name}</td>
                          <td><Badge bg="secondary">{plant.fuel_type}</Badge></td>
                          <td className="fw-bold">{plant.installed_capacity} MW</td>
                          <td className="text-muted small">{plant.eic}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="text-center py-4 text-muted">Kayıt bulunamadı.</td></tr>
                    )}
                  </tbody>
                </Table>
                
                {/* pagination */}
                {plantList.length > itemsPerPage && (
                  <div className="d-flex justify-content-center py-3 bg-light border-top">
                    <Pagination size="sm">
                       <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                       <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                       {[...Array(totalPages)].map((_, i) => (
                          <Pagination.Item key={i+1} active={i+1 === currentPage} onClick={() => paginate(i+1)}>{i+1}</Pagination.Item>
                       ))}
                       <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                       <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
                    </Pagination>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* right panel (super admin) */}
        {!isReadOnly && (
          <Col lg={4}>
            <Card className="text-white mb-3 shadow-sm border-0" style={{ backgroundColor: '#404e67' }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3">Sistem Özeti</h5>
                <p className="mb-4 small opacity-75">
                  Sistemde kayıtlı toplam organizasyon ve bu organizasyonlara bağlı aktif santral sayıları aşağıdadır.
                </p>
                
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                  <span className="opacity-75"><FaBuilding className="me-2"/>Toplam Organizasyon</span>
                  <span className="h4 fw-bold mb-0 text-info">{stats.totalOrgs}</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center">
                  <span className="opacity-75"><FaBolt className="me-2"/>Toplam Santral</span>
                  <span className="h4 fw-bold mb-0 text-warning">{stats.totalPlants}</span>
                </div>
              </Card.Body>
            </Card>

            <div className="d-grid">
              <Button 
                variant={isListView ? "primary" : "secondary"}
                size="lg"
                onClick={() => setIsListView(!isListView)}
                style={{
                   backgroundColor: isListView ? '#01a9ac' : '#343a40', 
                   border: 'none', 
                   fontWeight: 'bold'
                }}
              >
                {isListView ? <><FaPlus className="me-2"/> Yeni Santral Ekle</> : <><FaList className="me-2"/> Listeyi Görüntüle</>}
              </Button>
            </div>
          </Col>
        )}
      </Row>
    </MainLayout>
  );
};

export default PlantOperations;