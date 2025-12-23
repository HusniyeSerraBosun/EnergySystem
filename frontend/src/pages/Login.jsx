import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();

  // states 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // loading animation

  // input function
  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError('');
    setLoading(true);

    // FastAPI (OAuth2) Form-Data 
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      // Backend request 
      const response = await axios.post('https://energysystem.onrender.com/token', formData);
      
      // Backend data
      const { access_token, role } = response.data;

      if (!access_token) {
        throw new Error("Token alınamadı!");
      }

      // save
      localStorage.setItem('token', access_token);
      // default user if no role
      localStorage.setItem('role', role || 'user'); 
      localStorage.setItem('username', username || 'Kullanıcı'); 
      console.log("Giriş Başarılı! Rol:", role || 'user (varsayılan)');
      
      // redirect to dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error("Login Hatası:", err);
      // error messages
      if (err.response && err.response.status === 401) {
        setError('Kullanıcı adı veya şifre hatalı!');
      } else if (err.code === "ERR_NETWORK") {
        setError('Sunucuya ulaşılamıyor. Backend (main.py) çalışıyor mu?');
      } else {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false); // loading done
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "#404e67"
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={5} lg={4}>
            {/* heading area */}
            <div className="text-center mb-4">
              <h3 style={{color: "white", fontWeight: "bold"}}>
                <span style={{color: '#01a9ac'}}>E</span>nergySys
              </h3>
            </div>
            
            {/* login card */}
            <Card className="p-4 shadow" style={{borderTop: "4px solid #01a9ac", borderRadius: "5px"}}>
              <Card.Body>
                <div className="text-center mb-4">
                  <h4 className="mb-3 text-dark fw-bold">Giriş Yap</h4>
                  <p className="text-muted small">Hesabınıza erişmek için bilgilerinizi girin.</p>
                </div>

                {/* error message area */}
                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3">
                    <Form.Control 
                      type="text" 
                      placeholder="Kullanıcı Adı" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      style={{height: '45px'}}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Control 
                      type="password" 
                      placeholder="Şifre" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{height: '45px'}}
                    />
                  </Form.Group>

              

                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      size="lg" 
                      type="submit"
                      disabled={loading} 
                      style={{backgroundColor: "#01a9ac", border: "none", fontWeight: "bold"}}
                    >
                      {loading ? <Spinner animation="border" size="sm" /> : "GİRİŞ YAP"}
                    </Button>
                  </div>

                  <hr className="my-4" />
                  
                  <div className="text-center text-muted">
                    <small>Enerji Piyasası Simülasyonu <br/> v1.0.0</small>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;