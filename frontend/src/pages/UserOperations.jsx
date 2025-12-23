import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Card, Form, Button, Alert, Spinner, Table, Pagination, Row, Col, Badge } from 'react-bootstrap';
import { FaUser, FaList, FaCheckCircle, FaUserPlus } from 'react-icons/fa';
import axios from 'axios';

const UserOperations = () => {
  const [isListView, setIsListView] = useState(false); 
  
  const [userList, setUserList] = useState([]);
  const [orgList, setOrgList] = useState([]);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'analyst', //default
    organization_id: '' 
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // hidden companies and theri users
  const excludedOrgs = ["testBir", "testİki", "System"];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [resUsers, resOrgs] = await Promise.all([
        axios.get('https://energysystem.onrender.com/users/', { headers }), 
        axios.get('https://energysystem.onrender.com/organizations/', { headers }) 
      ]);

      const allUsers = resUsers.data || [];
      const allOrgs = resOrgs.data || [];

      // find banned org id
      const excludedOrgIds = allOrgs
        .filter(org => excludedOrgs.includes(org.name))
        .map(org => org.id);

      // org name for list
      const filteredOrgs = allOrgs
        .filter(org => !excludedOrgs.includes(org.name))
        .sort((a, b) => (a.name || "").localeCompare(b.name || "", 'tr'));

      // user name for list
      const filteredUsers = allUsers.filter(user => !excludedOrgIds.includes(user.organization_id));

      setUserList(filteredUsers);
      setOrgList(filteredOrgs);

    } catch (err) {
      console.error(err);
      setError("Veriler yüklenirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const getOrgNameById = (id) => {
    const org = orgList.find(o => o.id === id);
    return org ? org.name : '-';
  };

  // form operations
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
        username: formData.username,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        organization_id: parseInt(formData.organization_id) 
      };

      await axios.post('https://energysystem.onrender.com/users/', null, {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });

      setSuccess('Kullanıcı başarıyla oluşturuldu!');
      
      setFormData({
        username: '', password: '', first_name: '', last_name: '', 
        email: '', role: 'analyst', organization_id: ''
      });
      
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
  const currentItems = userList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(userList.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading && userList.length === 0 && orgList.length === 0) {
    return (
      <MainLayout>
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '80vh' }}>
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted fw-bold">Kullanıcı Verileri Yükleniyor...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Kullanıcı Yönetimi</h4>
        <span className="text-muted small">Sisteme yeni kullanıcı tanımlayın veya mevcut kullanıcıları yönetin.</span>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success"><FaCheckCircle className="me-2"/>{success}</Alert>}

      <Row>
        <Col lg={8}>
          {!isListView ? (
            // create form 
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white py-3 border-bottom-0">
                 <h6 className="mb-0 fw-bold text-muted" style={{color: '#01a9ac'}}>+ Yeni Kullanıcı Ekle</h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Form onSubmit={handleCreate}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">KULLANICI ADI</Form.Label>
                        <Form.Control type="text" name="username" value={formData.username} onChange={handleInputChange} required placeholder="Örn: ahmet.yilmaz" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">ŞİFRE</Form.Label>
                        <Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder="******" />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">AD</Form.Label>
                        <Form.Control type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required placeholder="Ahmet" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">SOYAD</Form.Label>
                        <Form.Control type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required placeholder="Yılmaz" />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                       <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">E-POSTA</Form.Label>
                        <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="ornek@sirket.com" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                       <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">KULLANICI ROLÜ</Form.Label>
                        <Form.Select name="role" value={formData.role} onChange={handleInputChange}>
                          <option value="analyst">Analyst (İzleyici)</option>
                          <option value="admin">Admin (Yönetici)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                       <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">BAĞLI OLDUĞU ORGANİZASYON</Form.Label>
                        <Form.Select name="organization_id" value={formData.organization_id} onChange={handleInputChange} required>
                          <option value="">Seçiniz...</option>
                          {orgList.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-end mt-2">
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
                 <h6 className="mb-0 fw-bold text-muted">Kayıtlı Kullanıcılar</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0 align-middle">
                  <thead style={{ backgroundColor: '#6c757d', color: '#ffffff' }}>
                    <tr>
                      <th className="ps-4">Kullanıcı Adı</th>
                      <th>Ad Soyad</th>
                      <th>E-Posta</th>
                      <th>Organizasyon</th>
                      <th>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((user) => (
                        <tr key={user.id}>
                          <td className="ps-4 fw-bold text-dark">
                             <FaUser className="me-2 text-muted small"/>
                             {user.username}
                          </td>
                          <td className="text-muted">{user.first_name} {user.last_name}</td>
                          <td className="small"><a href={`mailto:${user.email}`} className="text-decoration-none text-secondary">{user.email}</a></td>
                          
                          <td className="fw-bold text-primary">{getOrgNameById(user.organization_id)}</td>
                          
                          <td>
                            <Badge bg={user.role === 'admin' ? 'warning' : 'info'} text={user.role === 'admin' ? 'dark' : 'white'}>
                              {user.role}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="text-center py-4 text-muted">Kayıt bulunamadı.</td></tr>
                    )}
                  </tbody>
                </Table>
                
                {/* Pagination */}
                {userList.length > itemsPerPage && (
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

        {/* buton*/}
        <Col lg={4}>
          <div className="d-grid sticky-top" style={{top: '20px'}}>
            <Button 
              variant={isListView ? "primary" : "secondary"}
              size="lg"
              onClick={() => setIsListView(!isListView)}
              style={{
                 backgroundColor: isListView ? '#01a9ac' : '#343a40', 
                 border: 'none', 
                 fontWeight: 'bold',
                 padding: '15px'
              }}
            >
              {isListView ? <><FaUserPlus className="me-2"/> Yeni Kullanıcı Ekle</> : <><FaList className="me-2"/> Listeyi Görüntüle</>}
            </Button>
            
            <div className="mt-3 text-muted small fst-italic text-center">
              * Super Admin yetkisi ile kullanıcı işlemleri yapılmaktadır.
            </div>
          </div>
        </Col>
      </Row>
    </MainLayout>
  );
};

export default UserOperations;