import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Row, Col, Card, Form, Button, Table, Spinner, Alert, Pagination } from 'react-bootstrap';
import { FaBolt, FaChartLine, FaSearch, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const GenerationData = () => {
  //state
  const [dates, setDates] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [plantList, setPlantList] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  
  const [dataList, setDataList] = useState([]);
  const [showGraph, setShowGraph] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  // pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  //beginning
  useEffect(() => {
    fetchPlants();
    
    // default:yesterday 
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const start = new Date(yesterday.setHours(0, 0, 0, 0));
    const end = new Date(yesterday.setHours(23, 59, 59, 999));
    
    const formatLocal = (d) => {
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d - tzOffset).toISOString().slice(0, 16);
    };

    setDates({
      startDate: formatLocal(start),
      endDate: formatLocal(end)
    });
  }, []);

  const fetchPlants = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://energysystem.onrender.com/plants/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sorted = (res.data || []).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      setPlantList(sorted);
    } catch (err) {
      console.error("Santral listesi alınamadı", err);
    }
  };

  const formatDateForBackend = (dateString) => {
    return dateString + ":00";
  };

  const handleGetData = async () => {
    setLoading(true);
    setError(null);
    setWarning(null);
    setShowGraph(false);
    setCurrentPage(1); 

    const todayStr = new Date().toISOString().slice(0, 10);
    const selectedEndDay = dates.endDate.slice(0, 10);
    
    if (selectedEndDay >= todayStr) {
      setWarning("UYARI: Sistem kuralları gereği bugüne ait kesinleşmiş veriler henüz oluşmamıştır. Listede sadece düne (veya öncesine) ait verileri görebilirsiniz.");
    }

    try {
      const token = localStorage.getItem('token');
      
      const params = {
        start_date: formatDateForBackend(dates.startDate),
        end_date: formatDateForBackend(dates.endDate)
      };

      if (selectedPlant) {
        params.power_plant_id = parseInt(selectedPlant);
      }

      const res = await axios.post('https://energysystem.onrender.com/generation/', null, {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });

      setDataList(res.data || []);

    } catch (err) {
      console.error(err);
      setError("Veriler çekilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewGraph = () => {
    if (!selectedPlant) {
      alert(" Grafik görüntülemek için lütfen listeden belirli bir santral seçiniz.");
      return;
    }
    if (dataList.length === 0) {
      alert("Görüntülenecek veri yok. Lütfen önce 'Verileri Getir' butonuna basınız.");
      return;
    }
    setShowGraph(true);
  };

  // graphing closing function
  const handleCloseGraph = () => {
    setShowGraph(false);
  };

  const getCustomTicks = () => {
    if (dataList.length === 0) return [];
    return dataList
      .filter(d => {
        const h = new Date(d.timestamp).getHours();
        return h % 4 === 0 && new Date(d.timestamp).getMinutes() === 0;
      })
      .map(d => d.timestamp);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(dataList.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <MainLayout>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Üretim Verileri</h4>
        <span className="text-muted small">Santral bazlı gerçekleşen, planlanan ve uzlaştırma üretim verileri.</span>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="text-muted small fw-bold">BAŞLANGIÇ TARİHİ</Form.Label>
                <Form.Control 
                  type="datetime-local" 
                  value={dates.startDate}
                  onChange={(e) => setDates({...dates, startDate: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="text-muted small fw-bold">BİTİŞ TARİHİ</Form.Label>
                <Form.Control 
                  type="datetime-local" 
                  value={dates.endDate}
                  onChange={(e) => setDates({...dates, endDate: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="text-muted small fw-bold">SANTRAL SEÇİMİ</Form.Label>
                <Form.Select 
                  value={selectedPlant} 
                  onChange={(e) => setSelectedPlant(e.target.value)}
                >
                  <option value="">Tüm Santraller (Sadece Liste)</option>
                  {plantList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  style={{backgroundColor: '#01a9ac', border:'none', fontWeight:'bold'}}
                  onClick={handleGetData}
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" animation="border"/> : <><FaSearch className="me-2"/> VERİLERİ GETİR</>}
                </Button>
              </div>
            </Col>
          </Row>
          
          <Row className="mt-2">
             <Col md={{ span: 3, offset: 9 }}>
                <div className="d-grid">
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleViewGraph}
                    title={!selectedPlant ? "Grafik için santral seçmelisiniz" : ""}
                  >
                    <FaChartLine className="me-2"/> GRAFİK GÖRÜNTÜLE
                  </Button>
                </div>
             </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}
      {warning && <Alert variant="warning"><FaExclamationCircle className="me-2"/>{warning}</Alert>}

      {/* graph area */}
      {showGraph && selectedPlant && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold text-muted">Üretim Grafiği</h6>
            {/* closing button */}
            <Button variant="outline-danger" size="sm" onClick={handleCloseGraph} title="Grafiği Kapat">
              <FaTimes />
            </Button>
          </Card.Header>
          <Card.Body style={{height: '450px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dataList} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis 
                  dataKey="timestamp" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#999'}} 
                  ticks={getCustomTicks()}
                  tickFormatter={(t) => new Date(t).getHours().toString().padStart(2, '0') + ":00"}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999'}} />
                <Tooltip 
                  labelFormatter={(t) => new Date(t).toLocaleString('tr-TR')}
                  contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}}
                />
                <Legend verticalAlign="top" height={36}/>
                
                {/* actual generation */}
                <Area 
                  type="monotone" 
                  dataKey="actual_generation" 
                  name="Gerçekleşen (Actual)" 
                  fill="#0ac282" 
                  stroke="#0ac282" 
                  fillOpacity={0.3} 
                />

                {/* planned generation */}
                <Line 
                  type="monotone" 
                  dataKey="planned_generation" 
                  name="Planlanan (Planned)" 
                  stroke="#fe5d70" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false} 
                />

                {/* settlement generation */}
                <Line 
                  type="monotone" 
                  dataKey="settlement_generation" 
                  name="Uzlaştırma (Settlement)" 
                  stroke="#8d25afff" 
                  strokeWidth={2} 
                  dot={false} 
                />

              </ComposedChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      )}

      {/* table area */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
           <h6 className="mb-0 fw-bold text-muted">Saatlik Üretim Listesi</h6>
           <span className="badge bg-light text-dark border px-3 py-2 fw-normal">
              Toplam Kayıt: <span className="fw-bold">{dataList.length}</span>
           </span>
        </Card.Header>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0 align-middle">
            <thead style={{ backgroundColor: '#6c757d', color: '#ffffff' }}>
              <tr>
                <th className="ps-4">Tarih / Saat</th>
                <th>Santral Adı</th>
                <th>EIC Kodu</th>
                <th>Planlanan (MWh)</th>
                <th>Gerçekleşen (MWh)</th>
                <th>Uzlaştırma (MWh)</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((row, idx) => (
                  <tr key={idx}>
                    <td className="ps-4 text-muted small">{new Date(row.timestamp).toLocaleString('tr-TR')}</td>
                    <td className="fw-bold text-dark">{row.plant_name}</td>
                    <td className="text-muted small">{row.eic}</td>
                    
                    <td className="text-danger fw-bold">{row.planned_generation ? row.planned_generation : '-'}</td>
                    <td className="text-success fw-bold">{row.actual_generation}</td>
                    <td className="text-info fw-bold">{row.settlement_generation ? row.settlement_generation : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    {loading ? "Veriler yükleniyor..." : "Veri bulunamadı. Lütfen tarih ve santral seçip sorgulayın."}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {dataList.length > itemsPerPage && (
            <div className="d-flex justify-content-center py-3 bg-light border-top">
              <Pagination size="sm" className="mb-0">
                  <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                  
                  {[...Array(totalPages)].map((_, i) => {
                     if (i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 2 && i + 1 <= currentPage + 2)) {
                        return (
                          <Pagination.Item key={i+1} active={i+1 === currentPage} onClick={() => paginate(i+1)}>
                            {i+1}
                          </Pagination.Item>
                        );
                     } else if (i + 1 === currentPage - 3 || i + 1 === currentPage + 3) {
                        return <Pagination.Ellipsis key={i} disabled />;
                     }
                     return null;
                  })}

                  <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                  <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          )}

        </Card.Body>
      </Card>

    </MainLayout>
  );
};

export default GenerationData;