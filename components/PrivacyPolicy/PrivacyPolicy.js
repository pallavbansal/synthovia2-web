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
                  By accessing or using Synthovia, you agree to this Privacy Policy. 
                  If you do not agree, you must not use the service.
                </p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>1. Service Description</h2>
                <p style={styles.text}>
                  Synthovia provides AI-powered tools for content generation, branding, automation, and related services.
                </p>
                <ul style={styles.list}>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> We may change, update, or remove features at any time without notice.</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> We do not guarantee that the service will always be available, accurate, or error-free.</li>
                </ul>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>2. Account</h2>
                <p style={styles.text}>You may need to create an account to use Synthovia. You are responsible for:</p>
                <ul style={styles.list}>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Keeping your login secure</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> All activity on your account</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Any content created using your account</li>
                </ul>
                <p style={styles.text}>We may suspend or delete accounts at any time without notice.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>3. User Content</h2>
                <p style={styles.text}>You are responsible for all prompts, inputs, and generated content. You agree not to use Synthovia to create or share:</p>
                <ul style={styles.list}>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Illegal content</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Harmful content</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Copyrighted material without permission</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Spam or abuse</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Misleading or fraudulent content</li>
                </ul>
                <p style={styles.text}>Synthovia may remove content or block users at any time.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>4. AI Generated Output</h2>
                <p style={styles.text}>AI results may be incorrect, incomplete, or inaccurate. Synthovia is not responsible for:</p>
                <ul style={styles.list}>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Decisions made using AI output</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Business losses</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Financial losses</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Legal issues</li>
                  <li style={styles.listItem}><span style={styles.bullet}>•</span> Damages caused by generated content</li>
                </ul>
                <p style={styles.text}>Use AI output at your own risk.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>5. Payments</h2>
                <p style={styles.text}>Paid plans may be offered. All payments are final, non-refundable, and subject to change. We may change pricing at any time. Failure to pay may result in account suspension.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>6. Data & Storage</h2>
                <p style={styles.text}>We may store user data, prompts, and generated content to operate the service. We do not guarantee permanent storage. Data may be deleted at any time without notice.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>7. Third-Party Services</h2>
                <p style={styles.text}>Synthovia may use third-party services such as hosting providers, payment providers, and analytics tools. We are not responsible for third-party failures.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>8. No Warranty</h2>
                <p style={styles.text}>Synthovia is provided "as is" and "as available". We make no guarantees about accuracy, availability, reliability, security, or performance. Use the service at your own risk.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>9. Limitation of Liability</h2>
                <p style={styles.text}>Synthovia will not be liable for data loss, lost profits, business loss, indirect damages, service interruption, or AI errors. Your use of Synthovia is at your own risk.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>10. Termination</h2>
                <p style={styles.text}>We may suspend or terminate access at any time for any reason without notice.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>11. Changes to Terms</h2>
                <p style={styles.text}>We may update these Terms at any time. Continued use of Synthovia means you accept the new terms.</p>
              </div>

              <div style={styles.section}>
                <h2 style={styles.heading}>12. Acceptance</h2>
                <p style={styles.text}>By using Synthovia, you agree to these Terms and Conditions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
