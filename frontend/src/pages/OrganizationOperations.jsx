import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Card, Form, Button, Alert, Spinner, Table, Pagination, Row, Col, Badge } from 'react-bootstrap';
import { FaBuilding, FaList, FaCheckCircle, FaSave } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const OrganizationOperations = () => {
  
  const [searchParams, setSearchParams] = useSearchParams();
   
  const isListView = searchParams.get('view') === 'list';

  const [name, setName] = useState('');
  const [eic, setEic] = useState('');
  
  const [orgList, setOrgList] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // create org
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      // post request
      await axios.post('http://127.0.0.1:8000/organizations/', null, {
        headers: { Authorization: `Bearer ${token}` },
        params: { name: name, eic: eic }
      });

      setSuccess('Organizasyon başarıyla oluşturuldu!');
      setName('');
      setEic('');
      
    } catch (err) {
      console.error("Create Error:", err);
      if (err.response && err.response.status === 403) {
        setError('Yetkiniz yok! (Sadece Super Admin işlem yapabilir)');
      } else if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Bir hata oluştu. Sunucu bağlantısını kontrol edin.');
      }
    } finally {
      setLoading(false);
    }
  };

  // list org
  const fetchOrganizations = async () => {
    console.log("Veriler çekiliyor..."); // for debug
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/organizations/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Gelen Veri:", response.data); // view data in console
      // incoming data is array or not assign empty array
      setOrgList(Array.isArray(response.data) ? response.data : []);

    } catch (err) {
      console.error("List Error:", err);
      if (err.response && err.response.status === 403) {
        setError('Görüntüleme yetkiniz yok.');
      } else {
        setError('Veriler alınamadı. Backend çalışıyor mu?');
      }
      setOrgList([]); // empty in case of error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isListView) {
      fetchOrganizations();
    } else {
      setError(null);
      setSuccess('');
    }
  }, [isListView]);

  // view change function
  const toggleView = (targetView) => {
    if (targetView === 'list') {
      setSearchParams({ view: 'list' }); 
    } else {
      setSearchParams({}); 
    }
  };

  const safeList = orgList || [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = safeList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(safeList.length / itemsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <MainLayout>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold text-dark mb-1">Organizasyon Yönetimi</h4>
          <span className="text-muted small">Sisteme yeni organizasyon tanımlayın veya mevcutları listeleyin.</span>
        </div>
        
        {/* buttons */}
        {!isListView ? (
          <Button 
            variant="secondary" 
            onClick={() => toggleView('list')}
            style={{backgroundColor: '#404e67', border:'none'}}
          >
            <FaList className="me-2"/> Listeyi Görüntüle
          </Button>
        ) : (
          <Button 
            variant="primary" 
            onClick={() => toggleView('create')}
            style={{backgroundColor: '#01a9ac', border:'none'}}
          >
            <FaBuilding className="me-2"/> Yeni Organizasyon Ekle
          </Button>
        )}
      </div>

      {/* messages */}
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success"><FaCheckCircle className="me-2"/>{success}</Alert>}

      {/* create form */}
      {!isListView && (
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white py-3 border-bottom-0">
             <h6 className="mb-0 fw-bold text-muted" style={{color: '#01a9ac'}}>+ Yeni Organizasyon Ekle</h6>
          </Card.Header>
          <Card.Body className="p-4">
            <Form onSubmit={handleCreate}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-muted small">ORGANİZASYON ADI</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Örn: Enerji Üretim A.Ş." 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{height: '50px'}}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-muted small">EIC KODU</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Örn: 40X000000000000G" 
                      value={eic}
                      onChange={(e) => setEic(e.target.value)}
                      required
                      style={{height: '50px'}}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end mt-4">
                 <Button 
                   type="submit" 
                   disabled={loading}
                   style={{backgroundColor: '#01a9ac', border: 'none', padding: '10px 30px', fontWeight: 'bold'}}
                 >
                   {loading ? <Spinner size="sm" animation="border"/> : <><FaSave className="me-2"/> KAYDET</>}
                 </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/*list table*/}
      {isListView && (
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
             <h6 className="mb-0 fw-bold text-muted">Kayıtlı Organizasyonlar</h6>
             <span className="badge bg-light text-dark border">Toplam: {safeList.length}</span>
          </Card.Header>
          
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <>
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="bg-light text-muted">
                    <tr>
                      <th className="ps-4 py-3">ID</th>
                      <th>Organizasyon Adı</th>
                      <th>EIC Kodu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((org) => (
                        <tr key={org?.id || Math.random()} style={{borderBottom: '1px solid #f8f9fa'}}>
                          <td className="ps-4 fw-bold text-muted">#{org?.id}</td>
                          <td className="fw-bold text-dark">{org?.name}</td>
                          <td className="fw-bold text-dark">{org?.eic}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-4 text-muted">
                           {error ? "Veri alınamadı." : "Kayıt bulunamadı."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>

                {/* pagination */}
                {safeList.length > itemsPerPage && (
                  <div className="d-flex justify-content-center py-3 bg-light border-top">
                    <Pagination>
                      <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                      <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => paginate(i + 1)}>
                          {i + 1}
                        </Pagination.Item>
                      ))}

                      <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                      <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </MainLayout>
  );
};

export default OrganizationOperations;