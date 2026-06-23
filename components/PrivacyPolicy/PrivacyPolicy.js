import React from "react";

const PrivacyPolicy = () => {
  const styles = {
    section: {
      marginBottom: '40px',
    },
    heading: {
      color: '#f8fafc',
      fontSize: '24px',
      fontWeight: '600',
      marginBottom: '20px',
      borderLeft: '4px solid #3b82f6',
      paddingLeft: '16px',
    },
    subHeading: {
      color: '#e2e8f0',
      fontSize: '18px',
      fontWeight: '500',
      marginBottom: '12px',
      display: 'block',
    },
    text: {
      color: '#94a3b8',
      fontSize: '16px',
      lineHeight: '1.7',
      marginBottom: '16px',
    },
    list: {
      listStyleType: 'none',
      padding: 0,
      margin: 0,
    },
    listItem: {
      color: '#94a3b8',
      fontSize: '16px',
      lineHeight: '1.7',
      marginBottom: '10px',
      paddingLeft: '24px',
      position: 'relative',
    },
    bullet: {
      position: 'absolute',
      left: 0,
      color: '#3b82f6',
      fontWeight: 'bold',
    },
    card: {
      backgroundColor: '#141b2d',
      borderRadius: '16px',
      padding: '40px',
      border: '1px solid #1e293b',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    }
  };

  return (
    <div className="rbt-main-content mb--0">
      <div className="rbt-daynamic-page-content center-width">
        <div className="rbt-dashboard-content rainbow-section-gap">
          <div className="banner-area">
            <div className="settings-area">
              <h1 className="title" style={{ fontSize: '42px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>Privacy Policy</h1>
              <p style={{ color: '#94a3b8', fontSize: '16px' }}>Last updated: March 2026</p>
            </div>
          </div>
          
          <div className="content-page pb--50" style={{ marginTop: '40px' }}>
            <div style={styles.card}>
              <div style={styles.section}>
                <p style={styles.text}>
                  At Synthovia, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our AI-powered services. Please read this policy carefully.
                </p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>1. Information We Collect</h2>
                <p style={styles.text}>We may collect information about you in a variety of ways. The information we may collect includes:</p>
                <ul style={styles.list}>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> <strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and demographic information, that you voluntarily give to us when you register for an account.</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> <strong>Derivative Data:</strong> Information our servers automatically collect when you access the site, such as your IP address, your browser type, your operating system, and your access times.</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> <strong>Service Data:</strong> Prompts, content inputs, and any generated content resulting from your use of our AI tools.</li>
                </ul>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>2. How We Use Your Information</h2>
                <p style={styles.text}>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. We may use information collected about you via the Site to:</p>
                <ul style={styles.list}>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Create and manage your account.</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Generate and deliver AI-powered content based on your inputs.</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Improve our services, algorithms, and user experience.</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Process transactions and send you related information, including purchase confirmations and invoices.</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Send you technical notices, updates, security alerts, and support and administrative messages.</li>
                </ul>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>3. Information Sharing and Disclosure</h2>
                <p style={styles.text}>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
                <ul style={styles.list}>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process or to protect the rights, property, and safety of others.</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> <strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including AI models (like OpenAI or Anthropic), payment processing, data analysis, email delivery, hosting services, and customer service.</li>
                </ul>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>4. Data Security</h2>
                <p style={styles.text}>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>5. Data Retention</h2>
                <p style={styles.text}>We will only retain your personal information for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements. You can request deletion of your account and associated data at any time.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>6. Your Privacy Rights</h2>
                <p style={styles.text}>Depending on your location, you may have the following rights regarding your personal information:</p>
                <ul style={styles.list}>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> The right to access and receive a copy of your personal data.</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> The right to rectify any inaccurate or incomplete personal data.</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> The right to request the erasure of your personal data.</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> The right to object to or restrict the processing of your data.</li>
                </ul>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>7. Cookies and Tracking</h2>
                <p style={styles.text}>We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Site to help customize the Site and improve your experience. You can remove or reject cookies through your browser settings, but be aware that such action could affect the availability and functionality of the Site.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>8. Children's Privacy</h2>
                <p style={styles.text}>We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>9. Changes to This Privacy Policy</h2>
                <p style={styles.text}>We may update this Privacy Policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>10. Contact Us</h2>
                <p style={styles.text}>If you have questions or comments about this Privacy Policy, please contact us at support@synthovia.ai.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
