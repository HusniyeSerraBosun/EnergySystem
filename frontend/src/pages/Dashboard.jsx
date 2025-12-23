import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { FaBolt, FaChartLine, FaExclamationTriangle, FaCloudSun, FaArrowUp, FaArrowDown, FaIndustry } from 'react-icons/fa';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  // state defination
  const [plantStats, setPlantStats] = useState({ total: 0, active: 0, failure: 0, maintenance: 0 });
  const [pieData, setPieData] = useState([]);
  const [marketChartData, setMarketChartData] = useState([]);
  const [cardData, setCardData] = useState({
    consumption: { val: 0, time: '' },
    forecast: { val: 0, time: '' },
    generationList: [], 
    prices: { maxSmp: 0, minSmp: 0, maxPtf: 0, minPtf: 0 } 
  });

  const PIE_COLORS = {
    Active: '#0ac282',
    Failure: '#fe5d70',
    Maintenance: '#fe9365'
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDateForBackend = (dateObj) => {
    const tzOffset = dateObj.getTimezoneOffset() * 60000; 
    const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, -1);
    return localISOTime; 
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const role = localStorage.getItem('role') || 'analyst';
    setUserRole(role);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // time calculation
    const now = new Date();
    
    // for graph and consumption
    const chartStartDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const consumptionStartDate = new Date(now.getTime() - (24 * 60 * 60 * 1000)); 
    
    // yesterday- generation and prices 100%data 
    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    
    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    try {
      // power plants
      const resPlants = await axios.get('http://127.0.0.1:8000/plants/', { headers });
      const plants = resPlants.data || [];

      const stats = {
        total: plants.length,
        active: plants.filter(p => p.current_status === 'Active').length,
        failure: plants.filter(p => p.current_status === 'Failure').length,
        maintenance: plants.filter(p => p.current_status === 'Maintenance').length
      };
      setPlantStats(stats);
      
      setPieData([
        { name: 'Aktif', value: stats.active, color: PIE_COLORS.Active },
        { name: 'Arıza', value: stats.failure, color: PIE_COLORS.Failure },
        { name: 'Bakım', value: stats.maintenance, color: PIE_COLORS.Maintenance }
      ].filter(d => d.value > 0));

      // consumption 
      const resCons = await axios.post('http://127.0.0.1:8000/consumption/real-time', null, { 
        headers,
        params: {
          start_date: formatDateForBackend(consumptionStartDate),
          end_date: formatDateForBackend(now)
        }
      });
      
      const resForecast = await axios.post('http://127.0.0.1:8000/consumption/forecast', null, {
        headers,
        params: {
          start_date: formatDateForBackend(consumptionStartDate),
          end_date: formatDateForBackend(now)
        }
      });

      const lastCons = resCons.data.length > 0 ? resCons.data[resCons.data.length - 1] : { actual_consumption: 0, timestamp: '-' };
      const lastForecast = resForecast.data.length > 0 ? resForecast.data[resForecast.data.length - 1] : { demand_forecast: 0, timestamp: '-' };

      // market graph
      const resSmp = await axios.post('http://127.0.0.1:8000/market/smp', null, {
        headers,
        params: {
          start_date: formatDateForBackend(chartStartDate),
          end_date: formatDateForBackend(now)
        }
      });

      const resMpc = await axios.post('http://127.0.0.1:8000/market/ptf', null, {
        headers,
        params: {
          start_date: formatDateForBackend(chartStartDate),
          end_date: formatDateForBackend(now)
        }
      });

      const mergedChartData = resSmp.data.map(sItem => {
        const mItem = resMpc.data.find(m => m.timestamp === sItem.timestamp);
        return {
          time: new Date(sItem.timestamp).getHours() + ":00",
          smp: sItem.price_smf,
          ptf: mItem ? mItem.price_ptf : 0
        };
      }).slice(-10);
      setMarketChartData(mergedChartData);

      // market prices-yesterday
      const resSmpDaily = await axios.post('http://127.0.0.1:8000/market/smp', null, {
        headers,
        params: {
          start_date: formatDateForBackend(yesterdayStart),
          end_date: formatDateForBackend(yesterdayEnd)
        }
      });
      
      const resMpcDaily = await axios.post('http://127.0.0.1:8000/market/ptf', null, {
        headers,
        params: {
          start_date: formatDateForBackend(yesterdayStart),
          end_date: formatDateForBackend(yesterdayEnd)
        }
      });

      const smpVals = resSmpDaily.data.map(d => d.price_smf);
      const mpcVals = resMpcDaily.data.map(d => d.price_ptf);

      const priceStats = {
        maxSmp: smpVals.length ? Math.max(...smpVals) : 0,
        minSmp: smpVals.length ? Math.min(...smpVals) : 0,
        maxPtf: mpcVals.length ? Math.max(...mpcVals) : 0,
        minPtf: mpcVals.length ? Math.min(...mpcVals) : 0,
      };

      // generation-yesterday
      const resGen = await axios.post('http://127.0.0.1:8000/generation/', null, {
        headers,
        params: {
          start_date: formatDateForBackend(yesterdayStart),
          end_date: formatDateForBackend(yesterdayEnd)
        }
      });

      let genData = resGen.data;
      const uniquePlants = {};
      genData.forEach(item => {
        if (!uniquePlants[item.plant_name]) {
          uniquePlants[item.plant_name] = 0;
        }
        uniquePlants[item.plant_name] += item.actual_generation;
      });
      
      const plantPerformance = Object.keys(uniquePlants).map(key => ({
        name: key,
        val: uniquePlants[key]
      }));

      let topList = [];
      if (role === 'super_admin') {
        topList = plantPerformance.sort((a, b) => a.val - b.val).slice(0, 3);
      } else {
        topList = plantPerformance.sort((a, b) => b.val - a.val).slice(0, 3);
      }

      setCardData({
        consumption: { val: lastCons.actual_consumption, time: lastCons.timestamp !== '-' ? new Date(lastCons.timestamp).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : '-' },
        forecast: { val: lastForecast.demand_forecast, time: lastForecast.timestamp !== '-' ? new Date(lastForecast.timestamp).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : '-' },
        prices: priceStats,
        generationList: topList
      });

    } catch (err) {
      console.error("Dashboard veri hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const goToConsumption = () => navigate('/consumption');
  const goToGeneration = () => navigate('/uretim');

  if (loading) {
    return <MainLayout><div className="text-center p-5"><Spinner animation="border" variant="primary"/></div></MainLayout>;
  }

  return (
    <MainLayout>
      {/* info cards */}
      <Row className="mb-4">
        {/* orange */}
        <Col md={3}>
          <Card className="text-white h-100 shadow-sm" style={{backgroundColor: '#fe9365', cursor: 'pointer', border:'none'}} onClick={goToConsumption}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0 fw-bold">{cardData.consumption.val ? cardData.consumption.val.toLocaleString() : 0} MWh</h3>
                  <p className="mb-0 small opacity-75">Gerçek Tüketim</p>
                </div>
                <div style={{opacity: 0.4}}><FaBolt size={30} /></div>
              </div>
            </Card.Body>
            <div className="card-footer py-1 px-3" style={{backgroundColor: 'rgba(0,0,0,0.1)', fontSize: '12px'}}>
               Saat: {cardData.consumption.time}
            </div>
          </Card>
        </Col>

        {/* green */}
        <Col md={3}>
          <Card className="text-white h-100 shadow-sm" style={{backgroundColor: '#0ac282', cursor: 'pointer', border:'none'}} onClick={goToConsumption}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0 fw-bold">{cardData.forecast.val ? cardData.forecast.val.toLocaleString() : 0} MWh</h3>
                  <p className="mb-0 small opacity-75">Tahmini Tüketim</p>
                </div>
                <div style={{opacity: 0.4}}><FaCloudSun size={30} /></div>
              </div>
            </Card.Body>
            <div className="card-footer py-1 px-3" style={{backgroundColor: 'rgba(0,0,0,0.1)', fontSize: '12px'}}>
               Saat: {cardData.forecast.time}
            </div>
          </Card>
        </Col>

        {/* red */}
        <Col md={3}>
          <Card className="text-white h-100 shadow-sm" style={{backgroundColor: '#fe5d70', cursor: 'pointer', border:'none'}} onClick={goToGeneration}>
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="fw-bold mb-0">Üretim Performansı</h6>
                  <small style={{fontSize:'10px', opacity:0.8}}>
                    {userRole === 'super_admin' ? 'En Düşük Üretim (Dün)' : 'En Yüksek Üretim (Dün)'}
                  </small>
                </div>
                <div style={{opacity: 0.4}}><FaIndustry size={20} /></div>
              </div>
              <div className="small">
                {cardData.generationList.length > 0 ? (
                  cardData.generationList.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between border-bottom border-light pb-1 mb-1" style={{borderColor: 'rgba(255,255,255,0.3)'}}>
                      <span className="text-truncate" style={{maxWidth:'100px'}}>{item.name}</span>
                      <span className="fw-bold">{item.val.toLocaleString()}</span>
                    </div>
                  ))
                ) : (<span>Veri yok</span>)}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* blue */}
        <Col md={3}>
          <Card className="text-white h-100 shadow-sm" style={{backgroundColor: '#01a9ac', border:'none'}}>
            <Card.Body className="p-3">
              <h6 className="fw-bold mb-3">Günlük Piyasa (Dün)</h6>
              
              {/* PTF data */}
              <div className="d-flex justify-content-between mb-2">
                <span>PTF Max:</span><span className="fw-bold"><FaArrowUp size={10}/> {cardData.prices.maxPtf.toFixed(1)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>PTF Min:</span><span className="fw-bold"><FaArrowDown size={10}/> {cardData.prices.minPtf.toFixed(1)}</span>
              </div>
              
              <div style={{borderTop: '1px solid rgba(255,255,255,0.3)', margin:'5px 0'}}></div>
              
              {/* SMP data*/}
              <div className="d-flex justify-content-between mb-2">
                <span>SMP Max:</span><span className="fw-bold"><FaArrowUp size={10}/> {cardData.prices.maxSmp.toFixed(1)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>SMP Min:</span><span className="fw-bold"><FaArrowDown size={10}/> {cardData.prices.minSmp.toFixed(1)}</span>
              </div>

            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* graph and power plants */}
      <Row>
        <Col md={8}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-3">
              <h5 className="mb-0 fw-bold text-dark">Piyasa Fiyatları (SMP & PTF)</h5>
              <span className="text-muted small">Son 10 saatlik fiyat değişimi (TL/MWh)</span>
            </Card.Header>
            <Card.Body style={{height: '380px'}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marketChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSmp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fe5d70" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#fe5d70" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPtf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ac282" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0ac282" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#999'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#999'}} />
                  <Tooltip contentStyle={{borderRadius: '10px', border:'none', boxShadow:'0 2px 10px rgba(0,0,0,0.1)'}}/>
                  <Legend />
                  <Area type="monotone" dataKey="smp" name="SMP" stroke="#fe5d70" fillOpacity={1} fill="url(#colorSmp)" strokeWidth={3} />
                  <Area type="monotone" dataKey="ptf" name="PTF" stroke="#0ac282" fillOpacity={1} fill="url(#colorPtf)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-white py-3">
              <h5 className="mb-0 fw-bold text-dark">Santraller</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
              <div className="mb-4 text-center px-4 py-2" style={{border: '2px solid #fe5d70', borderRadius: '8px', minWidth: '150px'}}>
                <small className="text-muted text-uppercase fw-bold">Toplam Santral</small>
                <h2 className="mb-0 fw-bold text-dark">{plantStats.total}</h2>
              </div>
              <div style={{width: '220px', height: '220px', position: 'relative'}}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                      paddingAngle={5}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center'}}>
                   <h1 style={{color: '#0ac282', fontWeight: 'bold', margin: 0}}>{plantStats.active}</h1>
                   <small className="text-muted fw-bold">Aktif</small>
                </div>
              </div>
              <div className="d-flex justify-content-center gap-3 mt-2 mb-3">
                 {pieData.map((d, i) => (
                   <div key={i} className="d-flex align-items-center small">
                     <span style={{width:10, height:10, backgroundColor: d.color, borderRadius:'50%', display:'inline-block', marginRight:5}}></span>
                     {d.name}: {d.value}
                   </div>
                 ))}
              </div>
              <div className="text-center w-100">
                <Button variant="outline-primary" className="rounded-pill px-4 w-75 fw-bold" onClick={() => navigate('/plant/list')}>
                  Santralleri Görüntüle
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
};

export default Dashboard;