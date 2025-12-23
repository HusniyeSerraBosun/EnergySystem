import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Card, Table, Badge, Spinner, Alert, Row, Col, Form, Button, Pagination } from 'react-bootstrap';
import { FaArrowUp, FaArrowDown, FaMinus, FaSearch } from 'react-icons/fa';
import axios from 'axios';

const MarketData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24); // 24 hours 

  // date state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  //today date(default)
  useEffect(() => {
    const now = new Date();
    const start = new Date(now); start.setHours(0,0,0,0);
    const end = new Date(now); end.setHours(23,59,59,999);
    
    // YYYY-MM-DDTHH:MM
    const formatForInput = (d) => {
      const pad = (n) => n < 10 ? '0' + n : n;
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    
    setStartDate(formatForInput(start));
    setEndDate(formatForInput(end));
  }, []);

  const fetchMarketData = async (e) => {
    if(e) e.preventDefault();
 
    setCurrentPage(1);

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // query parameter for backend
      const params = {
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString()
      };

      // PTF ve SMP services request
      const [resPTF, resSMF] = await Promise.all([
        axios.post('https://energysystem.onrender.com/market/ptf', null, { headers, params }),
        axios.post('https://energysystem.onrender.com/market/smp', null, { headers, params })
      ]);

      const ptfList = resPTF.data;
      const smfList = resSMF.data;

      // merge 
      const mergedData = ptfList.map((ptfItem) => {
        const matchingSmf = smfList.find(smf => smf.timestamp === ptfItem.timestamp);
        const ptfVal = ptfItem.price_ptf;
        
        // null no SMP data
        const smfVal = matchingSmf ? matchingSmf.price_smf : null;

        // diff calculation
        const spread = (smfVal !== null) ? (smfVal - ptfVal) : null;

        return {
          timestamp: ptfItem.timestamp,
          ptf: ptfVal,
          smf: smfVal,
          spread: spread
        };
      });

      setData(mergedData);

    } catch (err) {
      console.error("Veri çekme hatası:", err);
      setError("Veriler alınırken bir hata oluştu. Backend servislerini kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('tr-TR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };


  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <MainLayout>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Piyasa Verileri (PTF / SMF)</h4>
        <span className="text-muted small">Gerçek zamanlı piyasa takas fiyatları ve sistem marjinal fiyatları karşılaştırması.</span>
      </div>

      {/* search area */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Form onSubmit={fetchMarketData}>
            <Row className="align-items-end">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">Başlangıç Tarihi</Form.Label>
                  <Form.Control 
                    type="datetime-local" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">Bitiş Tarihi</Form.Label>
                  <Form.Control 
                    type="datetime-local" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    style={{backgroundColor: '#01a9ac', border: 'none'}}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" animation="border" /> : <><FaSearch className="me-2"/> Verileri Getir</>}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
           <h6 className="mb-0 fw-bold text-muted">Saatlik Fiyat Listesi</h6>
           <span className="badge bg-light text-dark border">Toplam Kayıt: {data.length}</span>
        </Card.Header>
        
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <>
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light text-muted">
                  <tr>
                    <th className="ps-4 py-3">Tarih / Saat</th>
                    <th>PTF (TL/MWh)</th>
                    <th>SMF (TL/MWh)</th>
                    <th>Fark (Spread)</th>
                    <th className="text-end pe-4">Yön</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((row, index) => (
                      <tr key={index} style={{borderBottom: '1px solid #f8f9fa'}}>
                        <td className="ps-4 fw-bold text-dark">{formatDate(row.timestamp)}</td>
                        
                        {/* PTF */}
                        <td>
                          <span style={{color: '#01a9ac', fontWeight: 'bold'}}>
                            {row.ptf?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </span>
                        </td>

                        {/* SMF */}
                        <td>
                          {row.smf !== null ? (
                            <span className="text-dark fw-bold">
                              {row.smf.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </span>
                          ) : (
                            <span className="text-muted fw-bold" style={{fontSize: '18px'}}>-</span>
                          )}
                        </td>

                        {/* difference */}
                        <td>
                          {row.spread !== null ? (
                            <Badge bg={row.spread > 0 ? 'success' : row.spread < 0 ? 'danger' : 'secondary'} className="px-2 py-2">
                               {row.spread.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </Badge>
                          ) : (
                            <span className="text-muted small fst-italic">Açıklanmadı</span>
                          )}
                        </td>

                        {/* direction */}
                        <td className="text-end pe-4">
                          {row.spread !== null ? (
                            row.spread > 0 ? <span className="text-success fw-bold"><FaArrowUp size={12} className="me-1"/> Artış</span> :
                            row.spread < 0 ? <span className="text-danger fw-bold"><FaArrowDown size={12} className="me-1"/> Düşüş</span> :
                            <span className="text-muted"><FaMinus size={10} className="me-1"/> Stabil</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        Veri bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* page button */}
              {data.length > itemsPerPage && (
                <div className="d-flex justify-content-center py-3 bg-light border-top">
                  <Pagination>
                    <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                    
                    {[...Array(totalPages)].map((_, i) => {
                       const pageNum = i + 1;
                       
                       if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                         return (
                           <Pagination.Item key={pageNum} active={pageNum === currentPage} onClick={() => paginate(pageNum)}>
                             {pageNum}
                           </Pagination.Item>
                         );
                       } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                         return <Pagination.Ellipsis key={i} />;
                       }
                       return null;
                    })}

                    <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </MainLayout>
  );
};

export default MarketData;