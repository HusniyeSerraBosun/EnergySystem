import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Card, Table, Badge, Spinner, Alert, Row, Col, Form, Button, Pagination } from 'react-bootstrap';
import { FaArrowUp, FaArrowDown, FaMinus, FaSearch, FaBolt } from 'react-icons/fa';
import axios from 'axios';

const ConsumptionData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24); // 24-hour view

  // date state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // today date(default)
  useEffect(() => {
    const now = new Date();
    const start = new Date(now); start.setHours(0,0,0,0);
    const end = new Date(now); end.setHours(23,59,59,999);
    
    // YYYY-MM-DDTHH:MM  (date format)
    const formatForInput = (d) => {
      const pad = (n) => n < 10 ? '0' + n : n;
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    
    setStartDate(formatForInput(start));
    setEndDate(formatForInput(end));
  }, []);

  const fetchConsumptionData = async (e) => {
    if(e) e.preventDefault();
    setCurrentPage(1); //return to top in new search

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // query parameter due to backend (timezone error prevention)
      const params = {
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString()
      };

      // two services in parallel request
      const [resForecast, resRealTime] = await Promise.all([
        // forecast
        axios.post('https://energysystem.onrender.com/consumption/forecast', null, { headers, params }),
        // actual-two hours back
        axios.post('https://energysystem.onrender.com/consumption/real-time', null, { headers, params })
      ]);

      const forecastList = resForecast.data;
      const realTimeList = resRealTime.data;

      // merge
      // forecast list base (because always full)
      const mergedData = forecastList.map((forecastItem) => {
        // actual data matching forecast time.
        const matchingReal = realTimeList.find(item => item.timestamp === forecastItem.timestamp);
        
        const forecastVal = forecastItem.demand_forecast;

        const actualVal = matchingReal ? matchingReal.actual_consumption : null;

        // difference calculation
        const diff = (actualVal !== null) ? (actualVal - forecastVal) : null;

        return {
          timestamp: forecastItem.timestamp,
          forecast: forecastVal,
          actual: actualVal,
          diff: diff
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

  // pagination 
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <MainLayout>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Tüketim Verileri (Tahmin / Gerçekleşen)</h4>
        <span className="text-muted small">Talep tahmini ve gerçekleşen tüketim miktarlarının karşılaştırmalı analizi.</span>
      </div>

      {/* search area */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Form onSubmit={fetchConsumptionData}>
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

      {/* TABLO */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
           <h6 className="mb-0 fw-bold text-muted">Saatlik Tüketim Listesi</h6>
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
                    <th>Tahmin (MWh)</th>
                    <th>Gerçekleşen (MWh)</th>
                    <th>Sapma (Diff)</th>
                    <th className="text-end pe-4">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((row, index) => (
                      <tr key={index} style={{borderBottom: '1px solid #f8f9fa'}}>
                        <td className="ps-4 fw-bold text-dark">{formatDate(row.timestamp)}</td>
                        
                        {/* forecast */}
                        <td>
                          <span style={{color: '#01a9ac', fontWeight: 'bold'}}>
                            {row.forecast?.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} MWh
                          </span>
                        </td>

                        {/* actual  */}
                        <td>
                          {row.actual !== null ? (
                            <span className="text-dark fw-bold">
                              {row.actual.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} MWh
                            </span>
                          ) : (
                            <span className="text-muted fw-bold" style={{fontSize: '18px'}}>-</span>
                          )}
                        </td>

                        {/* difference */}
                        <td>
                          {row.diff !== null ? (
                            <Badge bg={row.diff > 0 ? 'danger' : row.diff < 0 ? 'success' : 'secondary'} className="px-2 py-2">
                               {row.diff > 0 ? '+' : ''}{row.diff.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                            </Badge>
                          ) : (
                            <span className="text-muted small fst-italic">Bekleniyor...</span>
                          )}
                        </td>

                        {/* status icon */}
                        <td className="text-end pe-4">
                          {row.diff !== null ? (
                            row.diff > 0 ? <span className="text-danger fw-bold"><FaArrowUp size={12} className="me-1"/> Yüksek</span> :
                            row.diff < 0 ? <span className="text-success fw-bold"><FaArrowDown size={12} className="me-1"/> Düşük</span> :
                            <span className="text-muted"><FaMinus size={10} className="me-1"/> Tam İsabet</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        Veri bulunamadı. Lütfen tarih seçiniz.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* pagination button */}
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

export default ConsumptionData;