import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section brand-section">
            <h3>BuildBuddy</h3>
            <p>
              Connecting customers and architects for seamless collaboration. 
              Building dreams, one project at a time.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
              <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            </div>
          </div>

          <div className="footer-section">
            <h4>For Customers</h4>
            <ul>
              <li><a href="#">Find Architects</a></li>
              <li><a href="#">Browse Portfolios</a></li>
              <li><a href="#">Project Gallery</a></li>
              <li><a href="#">How It Works</a></li>
              <li><a href="#">Pricing</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>For Architects</h4>
            <ul>
              <li><a href="#">Join BuildBuddy</a></li>
              <li><a href="#">Success Stories</a></li>
              <li><a href="#">Resources</a></li>
              <li><a href="#">Pro Tools</a></li>
              <li><a href="#">Community</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Safety</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-info">
            <div className="contact-info">
              <div className="contact-item">
                <i className="fas fa-phone"></i>
                <span>+91-1800-BUILD-BUDDY</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <a href="mailto:hello@buildbuddy.in">hello@buildbuddy.in</a>
              </div>
              <div className="contact-item">
                <i className="fas fa-map-marker-alt"></i>
                <span>Mumbai, Maharashtra</span>
              </div>
            </div>
            
            <div className="app-downloads">
              <span>Download our app:</span>
              <div className="download-buttons">
                <a href="#" className="download-btn">
                  <i className="fab fa-apple"></i>
                  <div>
                    <small>Download on the</small>
                    <strong>App Store</strong>
                  </div>
                </a>
                <a href="#" className="download-btn">
                  <i className="fab fa-google-play"></i>
                  <div>
                    <small>Get it on</small>
                    <strong>Google Play</strong>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <div className="footer-legal">
            <p>&copy; 2025 BuildBuddy, Inc. All rights reserved.</p>
            <div className="legal-links">
              <a href="#">Terms</a>
              <a href="#">Privacy</a>
              <a href="#">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;