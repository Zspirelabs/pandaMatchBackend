import mixpanel from 'npm:mixpanel-browser';

// Initialize Mixpanel with your project token and configuration options
mixpanel.init("2e7b2a60d8de1393e16dab651c19cf57", {
  debug: true,
  track_pageview: true,
  persistence: 'localStorage'
});

// Export the initialized Mixpanel instance
export default mixpanel;
