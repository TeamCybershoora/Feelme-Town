import React from 'react';

const Portfolio = () => {
  return (
    <div className="portfolio-container">
      <div className="portfolio-content">
        <div className="portfolio-text">
          <div className="portfolio-header">
            <span className="portfolio-label">PORTFOLIO</span>
            <div className="portfolio-line"></div>
            <h2 className="portfolio-title">
              <span className="crown-icon">👑</span>
              About FeelMe Town
            </h2>
          </div>
          
          <div className="portfolio-description">
            <p>
              Welcome to Feelme Town, your premier destination for unforgettable events and extraordinary parties! 
              At Feelme Town, we specialize in turning your visions into stunning realities, creating moments 
              that are cherished for a lifetime.
            </p>
            
            <p>
              With a passionate team of event planners and organizers, we offer a comprehensive range of services 
              tailored to meet your every need. From intimate gatherings to grand celebrations, corporate events 
              to private parties, we handle every aspect of event planning with meticulous attention to detail 
              and unparalleled creativity.
            </p>
            
            <div className="services-highlight">
              <h3>Our Premium Private Theatre Experience</h3>
              <p>
                Experience the ultimate in luxury entertainment with our state-of-the-art private theatres. 
                Featuring premium reclining seats, crystal-clear 4K projection, and immersive surround sound, 
                our theatres provide the perfect setting for intimate movie nights, corporate presentations, 
                or exclusive celebrations.
              </p>
            </div>
          </div>
        </div>
        
        <div className="portfolio-image">
          <div className="image-frame">
            <img 
              src="/theatre-gallery-1.jpg" 
              alt="FeelMe Town Private Theatre Experience"
              className="theatre-image"
            />
            <div className="image-overlay">
              <div className="overlay-content">
                <h4>Premium Private Theatre</h4>
                <p>Luxury seating • 4K Projection • Surround Sound</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .portfolio-container {
          min-height: 100vh;
         
          padding: 4rem 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .portfolio-content {
          max-width: 1200px;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        
        .portfolio-text {
          color: white;
        }
        
        .portfolio-header {
          margin-bottom: 2rem;
        }
        
        .portfolio-label {
          font-size: 0.9rem;
          color: #D3BBDC;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        .portfolio-line {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, #D3BBDC, #EDBAFF);
          margin: 0.5rem 0 1.5rem 0;
        }
        
        .portfolio-title {
          font-size: 2.5rem;
          font-weight: bold;
          color: #D3BBDC;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .crown-icon {
          font-size: 2rem;
          color: #EDBAFF;
        }
        
        .portfolio-description p {
          font-size: 1.1rem;
          line-height: 1.8;
          margin-bottom: 1.5rem;
          color: #e0e0e0;
        }
        
        .services-highlight {
          background: rgba(211, 187, 220, 0.1);
          border: 1px solid rgba(211, 187, 220, 0.3);
          border-radius: 12px;
          padding: 2rem;
          margin-top: 2rem;
        }
        
        .services-highlight h3 {
          color: #EDBAFF;
          font-size: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        
        .services-highlight p {
          color: #f0f0f0;
          font-size: 1rem;
          line-height: 1.6;
          margin: 0;
        }
        
        .portfolio-image {
          position: relative;
        }
        
        .image-frame {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(211, 187, 220, 0.3);
        }
        
        .theatre-image {
          width: 100%;
          height: 400px;
          object-fit: cover;
          display: block;
        }
        
        .image-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          padding: 2rem;
          color: white;
        }
        
        .overlay-content h4 {
          font-size: 1.3rem;
          margin-bottom: 0.5rem;
          color: #EDBAFF;
        }
        
        .overlay-content p {
          font-size: 0.9rem;
          color: #d0d0d0;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .portfolio-container {
            padding: 2rem 1rem;
          }
          
          .portfolio-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          
          .portfolio-title {
            font-size: 2rem;
          }
          
          .portfolio-description p {
            font-size: 1rem;
          }
          
          .services-highlight {
            padding: 1.5rem;
          }
          
          .theatre-image {
            height: 300px;
          }
        }
        
        @media (max-width: 480px) {
          .portfolio-title {
            font-size: 1.8rem;
          }
          
          .portfolio-description p {
            font-size: 0.95rem;
          }
          
          .services-highlight {
            padding: 1rem;
          }
          
          .theatre-image {
            height: 250px;
          }
        }
      `}</style>
    </div>
  );
};

export default Portfolio;
